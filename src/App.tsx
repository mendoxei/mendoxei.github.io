import './App.css'

import { Routes, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import RandomKanji from './RandomKanji'
import Home from './Home'
import { Avatar, Box, Divider } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2' // Grid version 2

function App() {
  return (
    <div className='App'>
      <Box sx={{ width: '100%', backgroundColor: 'turquoise' }}>
        <Grid
          container
          spacing={10}
          direction='row'
          justifyContent='center'
          alignItems='center'
        >
          <Grid xs={0}>
            <Avatar
              alt='mendoxei'
              src='fix.PNG'
              sx={{ width: '10vh', height: '10vh', margin: 2 }}
            />
          </Grid>
          <Grid xs={3}>
            <h1 style={{ color: 'yellow', fontSize: '5vh' }}>MENDOXEI</h1>
          </Grid>
        </Grid>
      </Box>
      <Grid spacing={0} direction='column' alignItems='center'>
        <Box sx={{ width: '100%', backgroundColor: 'lightgray' }}>
          <Link to='/'>Home </Link>
          <Link to='/kanji'>Kanji</Link>
        </Box>
      </Grid>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/kanji' element={<RandomKanji />} />
      </Routes>
    </div>
  )
}

export default App
