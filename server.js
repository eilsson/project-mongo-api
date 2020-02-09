import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'

import topMusicData from './data/top-music.json'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise


//
//   PORT=9000 npm start
const port = process.env.PORT || 8082
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())

const Track = mongoose.model('Track', {
  trackName: String,
  artistName: String,
  genre: String,
  bpm: Number
})

if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    await Track.deleteMany({})

    topMusicData.forEach((trackData) => {
      new Track(trackData).save((err) => {
        if (err) {
          console.log(err)
        }
      })
    })
  }
  seedDatabase()
}

// Start defining your routes here
app.get('/', (req, res) => {
  res.send('Hello world')
})

app.get('/tracks', async (req, res) => {
  const genreQuery = new RegExp(req.query.genre, 'i')
  const bpmQuery = req.query.bpm
  let tracks = await Track.find()

  if (genreQuery && bpmQuery) {
    tracks = await Track.find({
      $and:
        [{ genre: genreQuery },
        { bpm: bpmQuery }]
    })
  } else if (genreQuery || bpm) {
    tracks = await Track.find({
      $or:
        [{ genre: genreQuery },
        { bpm: bpmQuery }]
    })
  }

  res.json(tracks)
})

app.get('/tracks/:id', async (req, res) => {
  const track = await Track.findById(req.params.id)
  res.json(track)
})

app.get('/artists', async (req, res) => {
  const artists = await Track.find()
  res.json(artists)
})

app.get('/artists/:artist/tracks', async (req, res) => {
  const artistName = new RegExp(req.params.artist, 'i')
  const artist = await Track.find({ 'artistName': artistName })
  res.json(artist)
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
