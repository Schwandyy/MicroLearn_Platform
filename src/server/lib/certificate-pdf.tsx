import "server-only";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import React from "react";

type Locale = "de" | "en";

type CertificatePdfInput = {
  locale: Locale;
  recipient: string;
  pathTitle: string;
  issuedAt: Date;
  publicSlug: string;
  verifyUrl: string;
};

const COPY: Record<Locale, {
  brand: string;
  title: string;
  awarded: string;
  forCompleting: string;
  issued: string;
  verify: string;
  verifyHint: string;
  footer: string;
}> = {
  de: {
    brand: "MicroLearn · Zertifikat",
    title: "Abschluss-Zertifikat",
    awarded: "wird verliehen an",
    forCompleting: "für den erfolgreichen Abschluss von",
    issued: "Ausgestellt am",
    verify: "Verifizierung",
    verifyHint: "Echtheit prüfbar unter dem nebenstehenden Link.",
    footer: "Ausgestellt von MicroLearn · AZ-Delivery",
  },
  en: {
    brand: "MicroLearn · Certificate",
    title: "Certificate of Completion",
    awarded: "is awarded to",
    forCompleting: "for the successful completion of",
    issued: "Issued on",
    verify: "Verification",
    verifyHint: "Authenticity can be confirmed at the adjacent link.",
    footer: "Issued by MicroLearn · AZ-Delivery",
  },
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 36,
    fontFamily: "Helvetica",
  },
  outerFrame: {
    flex: 1,
    borderWidth: 6,
    borderColor: "#F5B544",
    borderRadius: 18,
    padding: 18,
  },
  innerFrame: {
    flex: 1,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#F5B544",
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 36,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 10,
    letterSpacing: 4,
    color: "#a16207",
    fontFamily: "Helvetica-Bold",
  },
  slug: {
    fontSize: 9,
    color: "#a16207",
    fontFamily: "Courier",
  },
  center: {
    alignItems: "center",
    textAlign: "center",
  },
  title: {
    fontSize: 38,
    fontFamily: "Times-Bold",
    color: "#111827",
    marginTop: 12,
  },
  awardedLine: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 28,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  recipient: {
    fontSize: 32,
    fontFamily: "Times-BoldItalic",
    color: "#111827",
    marginTop: 8,
  },
  forLine: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 22,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  pathTitle: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    color: "#a16207",
    marginTop: 8,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "#F5B544",
    marginVertical: 22,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  bottomBlock: {
    flexDirection: "column",
    maxWidth: 280,
  },
  bottomLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bottomValue: {
    fontSize: 11,
    color: "#374151",
  },
  qrBlock: {
    alignItems: "center",
    gap: 6,
  },
  qr: {
    width: 86,
    height: 86,
  },
  qrUrl: {
    fontSize: 7,
    color: "#6b7280",
    fontFamily: "Courier",
    maxWidth: 160,
    textAlign: "center",
  },
  footer: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 14,
  },
});

function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CertificateDocument(props: CertificatePdfInput & { qrDataUrl: string }) {
  const copy = COPY[props.locale];
  return (
    <Document
      title={`${copy.title} · ${props.recipient}`}
      author="MicroLearn"
      creator="MicroLearn"
      producer="MicroLearn"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
            <View style={styles.topRow}>
              <Text style={styles.brand}>{copy.brand.toUpperCase()}</Text>
              <Text style={styles.slug}>{props.publicSlug}</Text>
            </View>

            <View style={styles.center}>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.awardedLine}>{copy.awarded}</Text>
              <Text style={styles.recipient}>{props.recipient}</Text>
              <Text style={styles.forLine}>{copy.forCompleting}</Text>
              <Text style={styles.pathTitle}>«&nbsp;{props.pathTitle}&nbsp;»</Text>
              <View style={styles.divider} />
            </View>

            <View>
              <View style={styles.bottomRow}>
                <View style={styles.bottomBlock}>
                  <Text style={styles.bottomLabel}>{copy.issued}</Text>
                  <Text style={styles.bottomValue}>
                    {formatDate(props.issuedAt, props.locale)}
                  </Text>
                  <Text style={[styles.bottomLabel, { marginTop: 12 }]}>
                    {copy.verify}
                  </Text>
                  <Text style={styles.bottomValue}>{copy.verifyHint}</Text>
                </View>
                <View style={styles.qrBlock}>
                  <Image src={props.qrDataUrl} style={styles.qr} />
                  <Text style={styles.qrUrl}>{props.verifyUrl}</Text>
                </View>
              </View>
              <Text style={styles.footer}>{copy.footer}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(input.verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
    color: { dark: "#111827", light: "#ffffff" },
  });

  return renderToBuffer(<CertificateDocument {...input} qrDataUrl={qrDataUrl} />);
}
