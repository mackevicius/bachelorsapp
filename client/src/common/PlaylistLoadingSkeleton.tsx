import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

interface MediaProps {
  loading?: boolean;
}

export const PlaylistLoadingSkeleton = () => {
  return (
    <Grid container wrap="wrap">
      {Array.from(new Array(10)).map((item, index) => (
        <Box key={index} sx={{ width: 210, marginRight: 0.5, my: 5 }}>
          <Skeleton variant="rectangular" width={210} height={118} />
        </Box>
      ))}
    </Grid>
  );
};
