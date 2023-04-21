import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import React from 'react'

const RandomKanji = () => {
  const [keyword, setKeyword] = React.useState('')
  const [kanji, setKanji] = React.useState('')

  const searchJisho = () => {
    const url = `http://localhost:3001/jisho?keyword=${keyword}`
    fetch(url)
      .then((response) => {
        console.log(response)
        return response.json()
      })
      .then((data) => {
        console.log(data)
        setKanji(data)
      })
  }

  return (
    <div>
      <h1>Random Kanji</h1>
      <TextField
        id='outlined-basic'
        label='Keyword'
        variant='outlined'
        value={keyword}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setKeyword(event.target.value)
        }}
      />
      <Button onClick={searchJisho}>Generate</Button>
      <h1>{kanji}</h1>
    </div>
  )
}

export default RandomKanji
