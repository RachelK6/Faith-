from io import BytesIO
from xml.sax.saxutils import escape

def render_certificate(certificate):
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import landscape, letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=0.8 * inch,
        leftMargin=0.8 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title=f"Certificate - {certificate.course.title}",
        author="Optimum LMS",
    )
    name = certificate.student.get_full_name() or certificate.student.username
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CertificateTitle", parent=styles["Title"], fontSize=30,
        leading=38, textColor=colors.HexColor("#174ea6"), alignment=TA_CENTER,
    )
    body_style = ParagraphStyle(
        "CertificateBody", parent=styles["BodyText"], fontSize=15,
        leading=24, alignment=TA_CENTER,
    )
    meta_style = ParagraphStyle(
        "CertificateMeta", parent=styles["BodyText"], fontSize=9,
        leading=14, textColor=colors.HexColor("#4b5563"), alignment=TA_CENTER,
    )
    story = [
        Spacer(1, 0.25 * inch),
        Paragraph("CERTIFICATE OF COMPLETION", title_style),
        Spacer(1, 0.45 * inch),
        Paragraph("This certifies that", body_style),
        Spacer(1, 0.15 * inch),
        Paragraph(f"<b>{escape(name)}</b>", title_style),
        Spacer(1, 0.15 * inch),
        Paragraph("has successfully completed", body_style),
        Spacer(1, 0.15 * inch),
        Paragraph(f"<b>{escape(certificate.course.title)}</b>", title_style),
        Spacer(1, 0.4 * inch),
        Paragraph(
            f"Issued {certificate.issued_at:%B %d, %Y} - Certificate {certificate.certificate_number}",
            meta_style,
        ),
    ]
    document.build(story)
    return buffer.getvalue()