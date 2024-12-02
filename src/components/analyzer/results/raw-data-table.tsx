import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RawDataTableProps {
  data: any
}

export function RawDataTable({ data }: RawDataTableProps) {
  if (!data?.raw_data) return null;

  const variations = Object.entries(data.raw_data);
  if (!variations.length) return null;

  const [, firstVariationData] = variations[0];
  const columns = Object.keys(firstVariationData[0] || {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {variations.map(([variation, rows]) => 
                rows.map((row: any, index: number) => (
                  <TableRow key={`${variation}-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column}>{row[column]}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
