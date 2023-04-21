import {
  Button,
  Grid,
  Input,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
} from '@mui/material'
import React, { useEffect } from 'react'

const RandomKanji = () => {
  const [keyword, setKeyword] = React.useState('')
  const [kanji, setKanji] = React.useState('')
  const [length, setLength] = React.useState(2)
  const minLength = 1
  const maxLength = 10

  useEffect(() => {
    randomCharacters() // get a random character at first mount
  }, [])

  const searchJisho = () => {
    const url = `/jisho?keyword=${keyword}`
    fetch(url)
      .then((response) => {
        console.log(response)
        return response.json()
      })
      .then((data) => {
        console.log(data)
        setKanji(data.kanji)
      })
  }

  const randomCharacters = () => {
    const max = 0x9faf // 0x9faf is the last kanji in the unicode table
    const min = 0x4e00
    var characters: string = ''
    for (let i = 0; i < length; i++) {
      const unicode = Math.floor(Math.random() * (max - min) + min)
      characters += String.fromCharCode(unicode)
    }
    setKanji(characters)
  }

  return (
    <div>
      <h1>Random Kanji</h1>
      <Grid
        container
        spacing={2}
        alignItems='center'
        style={{ width: '50%', margin: 'auto' }}
      >
        <Grid item xs>
          <Slider
            value={length}
            onChange={(e, val) => setLength(Number(val))}
            aria-labelledby='input-slider'
            step={1}
            marks
            min={minLength}
            max={maxLength}
          />
        </Grid>
        <Grid item>
          <Input
            value={length}
            size='small'
            onChange={(e) => setLength(Number(e.target.value))}
            inputProps={{
              step: 1,
              min: minLength,
              max: maxLength,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </Grid>
      </Grid>
      <h1 style={{ fontSize: `10em` }}>{kanji}</h1>
      <Button onClick={randomCharacters}>Regenerate</Button>
      <h2>Search for a kanji instead</h2>
      <TextField
        id='outlined-basic'
        label='Keyword'
        variant='outlined'
        value={keyword}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setKeyword(event.target.value)
        }}
      />
      <Button onClick={searchJisho}>Search</Button>
    </div>
  )
}

export default RandomKanji
