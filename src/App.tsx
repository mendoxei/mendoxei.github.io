import './App.css'

import { Routes, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import RandomKanji from './RandomKanji'
import Home from './Home'

function App() {
  return (
    <div className='App'>
      <h1>Hello World</h1>
      <p>I'm hosted with GitHub Pages.</p>
      <div>
        <Link to='/'>Home </Link>
        <Link to='/kanji'>Kanji</Link>
      </div>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/kanji' element={<RandomKanji />} />
      </Routes>
    </div>
  )
}

export default App
