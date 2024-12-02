import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileUp } from "lucide-react"

interface FileUploadProps {
  type: "overall" | "transaction"
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  fileName?: string
}

export function FileUpload({ type, onUpload, fileName }: FileUploadProps) {
  const title = type === "overall" ? "Overall Data" : "Transaction Data"
  const description = type === "overall" 
    ? "Upload overall metrics data (users, sessions, etc.)"
    : "Upload transaction-level data"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="file"
              accept=".json"
              onChange={onUpload}
              className="cursor-pointer"
            />
          </div>
          {fileName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileUp className="h-4 w-4" />
              {fileName}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
