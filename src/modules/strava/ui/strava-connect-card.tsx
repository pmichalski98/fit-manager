"use client";

import { Button } from "@/components/ui/button";
import { Bike, Download, Loader2, Unlink, Zap, ZapOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  disconnectStrava,
  disableStravaWebhook,
  enableStravaWebhook,
  getStravaConnectionStatus,
  importStravaActivities,
} from "../actions";

type ConnectionStatus =
  | { connected: false }
  | {
      connected: true;
      athleteId: string;
      importedCount: number;
      webhookActive: boolean;
    };

export function StravaConnectCard() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getStravaConnectionStatus().then(setStatus);
  }, []);

  function handleImport() {
    setAction("import");
    setImportResult(null);
    setError(null);
    startTransition(async () => {
      const result = await importStravaActivities();
      if (result.ok && result.data) {
        setImportResult(result.data);
        const refreshed = await getStravaConnectionStatus();
        setStatus(refreshed);
      } else if (!result.ok) {
        setError(result.error ?? "Import failed");
      }
      setAction(null);
    });
  }

  function handleDisconnect() {
    setAction("disconnect");
    setError(null);
    startTransition(async () => {
      await disconnectStrava();
      setStatus({ connected: false });
      setImportResult(null);
      setAction(null);
    });
  }

  function handleWebhookToggle() {
    if (!status?.connected) return;
    const enabling = !status.webhookActive;
    setAction("webhook");
    setError(null);
    startTransition(async () => {
      const result = enabling
        ? await enableStravaWebhook()
        : await disableStravaWebhook();
      if (result.ok) {
        setStatus({ ...status, webhookActive: enabling });
      } else {
        setError(result.error ?? "Webhook update failed");
      }
      setAction(null);
    });
  }

  if (status === null) return null;

  return (
    <div className="bg-card flex flex-wrap items-center justify-between gap-4 rounded-[10px] border px-5 py-[18px]">
      <div className="flex min-w-0 items-center gap-3">
        <Bike className="text-cardio size-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.06em] uppercase">
            Strava
          </p>
          <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
            {status.connected ? (
              <>
                connected · {status.importedCount} activities · auto-sync{" "}
                <span
                  className={
                    status.webhookActive ? "text-primary" : "text-faint"
                  }
                >
                  {status.webhookActive ? "ON" : "OFF"}
                </span>
                {importResult && (
                  <>
                    {" "}
                    · imported {importResult.imported}
                    {importResult.skipped > 0 &&
                      `, skipped ${importResult.skipped}`}
                  </>
                )}
              </>
            ) : (
              "not connected · import cycling activities automatically"
            )}
            {error && <span className="text-destructive"> · {error}</span>}
          </p>
        </div>
      </div>
      {status.connected ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleImport}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            {isPending && action === "import" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            Import
          </Button>
          <Button
            onClick={handleWebhookToggle}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            {isPending && action === "webhook" ? (
              <Loader2 className="animate-spin" />
            ) : status.webhookActive ? (
              <Zap className="text-primary" />
            ) : (
              <ZapOff />
            )}
            Auto-sync
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={isPending}
            variant="outline-destructive"
            size="sm"
          >
            {isPending && action === "disconnect" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Unlink />
            )}
            Disconnect
          </Button>
        </div>
      ) : (
        <Button asChild size="sm">
          <a href="/api/strava/auth/connect">
            <Bike />
            Connect Strava
          </a>
        </Button>
      )}
    </div>
  );
}
