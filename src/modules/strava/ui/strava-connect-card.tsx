"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bike className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-lg">Strava</CardTitle>
        </div>
        <CardDescription>
          {status.connected
            ? `Connected — ${status.importedCount} activities imported`
            : "Connect your Strava account to import cycling activities"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status.connected ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleImport}
              disabled={isPending}
              variant="default"
              size="sm"
            >
              {isPending && action === "import" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Import Activities
            </Button>
            <Button
              onClick={handleWebhookToggle}
              disabled={isPending}
              variant={status.webhookActive ? "secondary" : "outline"}
              size="sm"
            >
              {isPending && action === "webhook" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : status.webhookActive ? (
                <Zap className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <ZapOff className="mr-2 h-4 w-4" />
              )}
              {status.webhookActive ? "Auto-sync on" : "Enable auto-sync"}
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={isPending}
              variant="outline"
              size="sm"
            >
              {isPending && action === "disconnect" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </Button>
          </div>
        ) : (
          <Button asChild variant="default" size="sm">
            <a href="/api/strava/auth/connect">
              <Bike className="mr-2 h-4 w-4" />
              Connect Strava
            </a>
          </Button>
        )}
        {importResult && (
          <p className="text-muted-foreground text-sm">
            Imported {importResult.imported} activities
            {importResult.skipped > 0 &&
              `, skipped ${importResult.skipped} (already imported)`}
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}
