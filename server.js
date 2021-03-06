import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'

import topMusicData from './data/top-music.json'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const port = process.env.PORT || 8082
const app = express()

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
      new Track(trackData).save()
    })
  }
  seedDatabase()
}

app.get('/', async (req, res) => {
  const tracks = await Track.find()
  res.json(tracks)
})

app.get('/tracks', async (req, res) => {
  const genreQuery = new RegExp(req.query.genre, 'i')
  const bpmQuery = parseInt(req.query.bpm)
  let tracks = await Track.find()


  try {
    if (genreQuery && bpmQuery) {
      tracks = await Track.find({
        $and: [{ 'genre': genreQuery }, { 'bpm': bpmQuery }]
      }
      )
    } else if (genreQuery) {
      tracks = await Track.find({ 'genre': genreQuery })
    } else if (bpmQuery) {
      tracks = await Track.find({ 'bpm': bpmQuery })
    }
    if (tracks.length === 0) {
      throw new Error("No tracks found.")
    }
    res.json(tracks)
  } catch (err) {
    res.status(404).json({ message: "No tracks found" })
  }
})

app.get('/tracks/:id', async (req, res) => {
  let track

  try {
    track = await Track.findById(req.params.id)
  } catch (error) {
    return res.status(404).json({ message: "Track not found" })
  }

  if (track) {
    res.json(track)
  }
})

app.get('/artists', async (req, res) => {
  const artists = await Track.find()
  res.json(artists)
})

app.get('/artists/:artist/tracks', async (req, res) => {
  const artistName = new RegExp(req.params.artist, 'i')
  let artist
  try {
    artist = await Track.find({ 'artistName': artistName })
    if (artist.length === 0) {
      throw new Error("Invalid name")
    }
    res.json(artist)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})