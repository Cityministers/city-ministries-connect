import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

type Props = { label: string; title: string; who: string; where: string; link: string };

export function ActivityAlertEmail({ label, title, who, where, link }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`${label}: ${title}`}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "520px" }}>
          <Text style={{ color: "#8a6d1f", fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase" }}>
            City Ministers activity
          </Text>
          <Heading style={{ fontSize: "22px", color: "#1a1a2e", margin: "0 0 12px" }}>{label}</Heading>
          <Text style={{ fontSize: "16px", color: "#222" }}>
            <strong>{title}</strong>
          </Text>
          <Text style={{ fontSize: "15px", color: "#444" }}>
            By {who}
            {where ? ` · ${where}` : ""}
          </Text>
          <Button
            href={link}
            style={{ backgroundColor: "#d4a72c", color: "#1a1a2e", padding: "14px 22px", borderRadius: "999px", fontWeight: 700, fontSize: "16px" }}
          >
            Open admin page
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
