const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

// Set up express app
const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
const dbUrl = 'mongodb://127.0.0.1:27017/eventDatabase';

let db; // Declare the db variable

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to the database');
    db = client.db('eventDatabase'); // Assign the connected database to the db variable

    // Start the server after successfully connecting to the database
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

connectToDatabase();

// Define your routes after the database connection is established

app.get('/', (req, res) => {
  res.json('website is live');
});

// // GET /api/v3/app/events?id=:event_id - Get an event by its unique id
// // AND
// // GET /api/v3/app/events?type=latest&limit=5&page=1 - Get latest events with pagination

app.get('/api/v3/app/events', (req, res) => {
  const eventId = req.query.id;
  const type = req.query.type;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;

  if (eventId) {
    db.collection('events')
      .findOne({ _id: new ObjectId(eventId) })
      .then((event) => {
        if (event) {
          res.json(event);
        } else {
          res.status(404).send('Event not found');
        }
      })
      .catch((err) => {
        console.error('Error retrieving the event:', err);
        res.status(500).send('Error retrieving the event');
      });
  } else if (type === 'latest') {
    db.collection('events')
      .find()
      .sort({ schedule: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()
      .then((events) => {
        res.json(events);
      })
      .catch((err) => {
        console.error('Error retrieving the events:', err);
        res.status(500).send('Error retrieving the events');
      });
  } else {
    res.status(400).send('Invalid request');
  }
});

// POST /api/v3/app/events - Create an event
app.post('/api/v3/app/events', (req, res) => {
  const event = req.body;

  db.collection('events')
    .insertOne(event)
    .then((result) => {
      res.json({ id: result.insertedId });
    })
    .catch((err) => {
      console.error('Error creating the event:', err);
      res.status(500).send('Error creating the event');
    });
});

// PUT /api/v3/app/events/:id - Update an event
app.put('/api/v3/app/events/:id', (req, res) => {
  const eventId = req.params.id;
  const updatedEvent = req.body;

  db.collection('events')
    .updateOne(
      { _id: ObjectId.createFromHexString(eventId) },
      { $set: updatedEvent }
    )
    .then(() => {
      res.send('Event updated successfully');
    })
    .catch((err) => {
      console.error('Error updating the event:', err);
      res.status(500).send('Error updating the event');
    });
});

// DELETE /api/v3/app/events/:id - Delete an event
app.delete('/api/v3/app/events/:id', (req, res) => {
  const eventId = req.params.id;

  db.collection('events')
    .deleteOne({ _id: new ObjectId(eventId) }) // Use 'new' keyword to create ObjectId instance
    .then(() => {
      res.send('Event deleted successfully');
    })
    .catch((err) => {
      console.error('Error deleting the event:', err);
      res.status(500).send('Error deleting the event');
    });
});
