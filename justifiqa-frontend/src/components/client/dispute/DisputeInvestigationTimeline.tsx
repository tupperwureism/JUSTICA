import { BadgeCheck, Fingerprint } from 'lucide-react'
import { investigationLogs } from './disputeData'

export function DisputeInvestigationTimeline() {
  return (
    <div className="dispute-timeline">
      <div className="dispute-investigator">
        <BadgeCheck className="h-5 w-5 text-blue-500" />
        <div><strong>Dewan Kepatuhan Justica</strong><span>Sertifikasi Arbiter BANI #8812</span></div>
      </div>
      {investigationLogs.map((log) => (
        <article key={log.time} className="dispute-log-item">
          <Fingerprint className="h-5 w-5 text-blue-500" />
          <div><time>{log.time}</time><h3>{log.title}</h3><p>{log.detail}</p></div>
        </article>
      ))}
    </div>
  )
}
