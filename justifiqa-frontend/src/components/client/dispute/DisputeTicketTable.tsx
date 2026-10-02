import { Badge } from '../../ui/badge'

export function DisputeTicketTable() {
  return (
    <div className="dispute-table-wrap">
      <table className="dispute-table">
        <thead>
          <tr><th>ID Tiket</th><th>Advokat</th><th>Status Dana</th><th>Tahap</th></tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-black text-foreground">#DSP-202607-001</td>
            <td>Dr. Mahendra K.</td>
            <td><Badge className="border-red-500/40 bg-red-500/10 text-red-500">ESCROW FROZEN</Badge></td>
            <td><Badge variant="outline" className="border-amber-500/40 text-amber-600">MEDIASI DALAM PROSES</Badge></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
