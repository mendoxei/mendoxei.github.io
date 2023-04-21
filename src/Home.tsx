import { Avatar, Box, Grid } from '@mui/material'

const Home = () => {
  return (
    <div>
      <Box sx={{ backgroundColor: 'white' }}>
        <Grid
          container
          spacing={2}
          alignItems='center'
          direction='column'
          justifyContent='center'
          style={{ width: '50%', margin: 'auto' }}
        >
          <p>
            <h3>Gametechnologie Introductieproject trailer: Noxium</h3>
            <iframe
              width='560'
              height='315'
              src='https://www.youtube.com/embed/oTy7rO4hEvU'
              title='YouTube video player'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            ></iframe>
          </p>
          <p>
            <h3>FairRecKit demo/trailer</h3>
            <iframe
              width='560'
              height='315'
              src='https://www.youtube.com/embed/6C1cRpy4b44'
              title='YouTube video player'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            ></iframe>
          </p>
        </Grid>
      </Box>
    </div>
  )
}

export default Home
