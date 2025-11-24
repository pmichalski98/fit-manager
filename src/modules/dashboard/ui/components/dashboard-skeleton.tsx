import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDayLabel } from "../../utils";

type DashboardTableSkeletonProps = {
  dayDates: Date[];
  dayKeys: string[];
};

export function DashboardTableSkeleton({
  dayDates,
  dayKeys,
}: DashboardTableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          {dayDates.map((d, idx) => (
            <TableHead key={idx}>{formatShortDayLabel(d)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead>Weight</TableHead>
          {dayKeys.map((k) => (
            <TableCell key={`w-skeleton-${k}`}>
              <Skeleton className="h-4 w-12" />
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableHead>Calories</TableHead>
          {dayKeys.map((k) => (
            <TableCell key={`c-skeleton-${k}`}>
              <Skeleton className="h-4 w-16" />
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableHead>Trainings</TableHead>
          {dayKeys.map((k) => (
            <TableCell key={`t-skeleton-${k}`}>
              <Skeleton className="h-8 w-full min-w-[100px]" />
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead>Weight (avg)</TableHead>
          <TableCell colSpan={7}>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableHead>Calories (avg)</TableHead>
          <TableCell colSpan={7}>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableHead>Trainings (count)</TableHead>
          <TableCell colSpan={7}>
            <Skeleton className="h-4 w-8" />
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
