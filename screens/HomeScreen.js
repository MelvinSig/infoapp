import { ScrollView, StyleSheet } from "react-native";
import { Card, Text, Button, List, IconButton } from "react-native-paper";

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Cover
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Baskets_four_styles.jpg"
          }}
          style={styles.coverImage}
        />
        <Card.Content>
          <Text variant="headlineMedium">Basket Throwing Competition 2024</Text>
          <Text variant="bodyLarge">
            Join us for an exciting day of basket throwing! Test your skills and
            win amazing prizes.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, styles.elevatedCard]}>
        <Card.Content>
          <Text variant="headlineMedium">Event Details</Text>
          <Text variant="bodyLarge">Date: June 15, 2024</Text>
          <Text variant="bodyLarge">Location: Central Park</Text>
          <Text variant="bodyLarge">Time: 10:00 AM - 4:00 PM</Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={() => {}}>
            Register Now
          </Button>
          <Button mode="outlined" onPress={() => {}}>
            Share
          </Button>
        </Card.Actions>
      </Card>

      <Card style={[styles.card, styles.outlinedCard]}>
        <Card.Content>
          <Text variant="headlineMedium">Categories</Text>
          <List.Item
            title="Professional Division"
            left={() => <List.Icon icon="trophy" />}
          />
          <List.Item
            title="Amateur Division"
            left={() => <List.Icon icon="medal" />}
          />
          <List.Item
            title="Kids Division (Ages 8-12)"
            left={() => <List.Icon icon="star" />}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, styles.flatCard]}>
        <Card.Content>
          <Text variant="headlineMedium">Prizes</Text>
          <List.Item
            title="1st Place"
            description="$1000 + Trophy"
            left={() => <List.Icon icon="crown" color="#FFD700" />}
          />
          <List.Item
            title="2nd Place"
            description="$500 + Medal"
            left={() => <List.Icon icon="medal" color="#C0C0C0" />}
          />
          <List.Item
            title="3rd Place"
            description="$250 + Medal"
            left={() => <List.Icon icon="medal" color="#CD7F32" />}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, styles.interactiveCard]}>
        <Card.Content>
          <Text variant="headlineMedium">Frequently Asked Questions</Text>
          <List.AccordionGroup>
            <List.Accordion
              id="faq1"
              title="What equipment do I need?"
              left={() => <List.Icon icon="basket" />}>
              <List.Item
                description="You'll need your own basket and throwing equipment. Basic safety gear is provided, but you're welcome to bring your own."
                descriptionNumberOfLines={3}
              />
            </List.Accordion>

            <List.Accordion
              id="faq2"
              title="How do I register?"
              left={() => <List.Icon icon="account-plus" />}>
              <List.Item
                description="Click the 'Register Now' button above or visit our website. Registration closes one week before the event."
                descriptionNumberOfLines={3}
              />
            </List.Accordion>

            <List.Accordion
              id="faq3"
              title="What are the rules?"
              left={() => <List.Icon icon="gavel" />}>
              <List.Item
                description="Each participant gets 3 throws per round. The basket must land within the designated area. Professional division has additional technical requirements."
                descriptionNumberOfLines={4}
              />
            </List.Accordion>

            <List.Accordion
              id="faq4"
              title="Is there a registration fee?"
              left={() => <List.Icon icon="cash" />}>
              <List.Item
                description="Yes, registration fees are $50 for Professional, $30 for Amateur, and $20 for Kids division. Includes event t-shirt and lunch."
                descriptionNumberOfLines={3}
              />
            </List.Accordion>

            <List.Accordion
              id="faq5"
              title="Is this a real event?"
              left={() => <List.Icon icon="basket" />}>
              <List.Item description="No." descriptionNumberOfLines={1} />
            </List.Accordion>
          </List.AccordionGroup>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5"
  },
  coverImage: {
    height: 200,
    marginVertical: 16
  },
  card: {
    marginBottom: 16
  },
  elevatedCard: {
    elevation: 8,
    backgroundColor: "white"
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "white"
  },
  flatCard: {
    elevation: 0,
    backgroundColor: "white"
  },
  interactiveCard: {
    elevation: 2,
    backgroundColor: "white"
  }
});

export default HomeScreen;