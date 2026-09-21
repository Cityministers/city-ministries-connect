import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  message: string;
  theirFeedback: string;
  replyTo: string;
};

/** The reply a City Ministers admin sends to someone who submitted feedback. */
export function FeedbackReplyEmail({ message, theirFeedback, replyTo }: Props) {
  return (
    <Html>
      <Head />
      <Preview>A reply from City Ministers</Preview>
      <Body style={{ backgroundColor: "#f6f5f2", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ fontSize: "20px", color: "#171320", margin: "0 0 12px" }}>
            City Ministers
          </Heading>
          <Text style={{ fontSize: "16px", color: "#2b2535", lineHeight: "24px" }}>
            Thank you for the feedback you sent us. Here is our reply:
          </Text>
          <Section
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #e4e0d8",
            }}
          >
            {message.split("\n").map((line, i) => (
              <Text
                key={i}
                style={{ fontSize: "16px", color: "#171320", lineHeight: "24px", margin: "0 0 8px" }}
              >
                {line}
              </Text>
            ))}
          </Section>
          {theirFeedback ? (
            <>
              <Hr style={{ borderColor: "#e4e0d8", margin: "20px 0" }} />
              <Text style={{ fontSize: "13px", color: "#6d6678", lineHeight: "20px" }}>
                You wrote: {theirFeedback}
              </Text>
            </>
          ) : null}
          <Text style={{ fontSize: "13px", color: "#6d6678", marginTop: "16px" }}>
            Just reply to this email to reach us at {replyTo}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default FeedbackReplyEmail;
