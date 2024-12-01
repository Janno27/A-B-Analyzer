import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface FileUploadProps {
  type: 'overall' | 'transaction'
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  fileName?: string
}

export const FileUpload = ({ type, onUpload, fileName }: FileUploadProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">
        Données {type === 'overall' ? 'Overall' : 'Transactions'}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => document.getElementById(`${type}File`)?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Charger fichier
        </Button>
        <input
          id={`${type}File`}
          type="file"
          className="hidden"
          accept=".json"
          onChange={onUpload}
        />
        {fileName && (
          <span className="text-green-600 text-sm">{fileName}</span>
        )}
      </div>
    </CardContent>
  </Card>
)