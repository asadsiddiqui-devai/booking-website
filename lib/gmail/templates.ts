import type { TravelRequest } from "@/lib/types";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function buildAgentNotificationEmail(
  req: TravelRequest,
  siteUrl: string
): { subject: string; html: string } {
  const requestDate = formatDate(req.created_at.slice(0, 10));
  const subject = `Travel Request #${req.request_number} Dated ${requestDate}`;

  const legsHtml = req.legs
    .map(
      (leg, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
        <td style="padding:10px 16px;color:#6b7280;font-weight:500;white-space:nowrap">Trip ${i + 1}</td>
        <td style="padding:10px 16px">
          City from <strong>${leg.from}</strong> &rarr; City to <strong>${leg.to}</strong>,&nbsp;
          Departure date <strong>${formatDate(leg.date)}</strong>
        </td>
      </tr>`
    )
    .join("");

  const passengersHtml = req.passenger_names
    .map((name, i) => `<li style="margin-bottom:4px">Passenger ${i + 1}: <strong>${name}</strong></li>`)
    .join("");

  const acceptUrl = `${siteUrl}/travel-request/respond?token=${req.action_token}&action=accept`;
  const rejectUrl = `${siteUrl}/travel-request/respond?token=${req.action_token}&action=reject`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f3f4f6;margin:0;padding:32px 16px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

    <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:32px;color:#fff">
      <div style="font-size:22px;font-weight:700;letter-spacing:-0.3px">Wanderly</div>
      <div style="font-size:13px;opacity:0.8;margin-top:4px">Travel Request Notification</div>
    </div>

    <div style="padding:32px">
      <h2 style="margin:0 0 6px;font-size:20px;color:#111827">${subject}</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px">A new travel request has been submitted and requires your review.</p>

      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:24px">
        <tr style="background:#f9fafb">
          <td style="padding:10px 16px;font-weight:600;color:#374151;width:35%">Guest Name</td>
          <td style="padding:10px 16px;color:#111827">${req.guest_name}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-weight:600;color:#374151">Passengers</td>
          <td style="padding:10px 16px"><ul style="margin:0;padding-left:18px;color:#111827">${passengersHtml}</ul></td>
        </tr>
        ${legsHtml}
        ${req.notes ? `
        <tr style="background:#f9fafb">
          <td style="padding:10px 16px;font-weight:600;color:#374151">Notes</td>
          <td style="padding:10px 16px;color:#111827">${req.notes}</td>
        </tr>` : ""}
      </table>

      <p style="margin:0 0 16px;font-weight:600;color:#374151">Please review and respond:</p>
      <div>
        <a href="${acceptUrl}"
           style="display:inline-block;padding:12px 32px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;margin-right:12px">
          ✓ Accept
        </a>
        <a href="${rejectUrl}"
           style="display:inline-block;padding:12px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
          ✗ Reject
        </a>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#9ca3af">Each button can only be used once. Clicking Accept or Reject will immediately update the request status.</p>
    </div>

    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">Wanderly Travel Request System &middot; This email was sent automatically.</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

export function buildGuestConfirmationEmail(
  req: TravelRequest,
  action: "accepted" | "rejected"
): { subject: string; html: string } {
  const status = action === "accepted" ? "Accepted" : "Rejected";
  const color = action === "accepted" ? "#16a34a" : "#dc2626";
  const bgColor = action === "accepted" ? "#f0fdf4" : "#fef2f2";
  const subject = `Your Travel Request #${req.request_number} has been ${status}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f3f4f6;margin:0;padding:32px 16px">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
    <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:32px;color:#fff">
      <div style="font-size:22px;font-weight:700">Wanderly</div>
    </div>
    <div style="padding:32px;text-align:center">
      <div style="display:inline-block;padding:12px 24px;background:${bgColor};border-radius:50px;color:${color};font-weight:700;font-size:18px;margin-bottom:16px">
        ${status}
      </div>
      <h2 style="margin:0 0 12px;color:#111827">${subject}</h2>
      <p style="color:#6b7280;margin:0">
        Your travel request <strong>#${req.request_number}</strong> for <strong>${req.guest_name}</strong>
        has been <strong style="color:${color}">${status.toLowerCase()}</strong> by the travel agent.
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
