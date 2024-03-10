import { Review } from '../entities/review.entity';
import {
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Link,
  Rating,
} from '@mui/material';

export default function ReviewCard({ review }: { review: Review }) {

  const sofiaUrl = '/sofia.png'
  return (
    <Card variant="outlined">
      <CardContent>
          <Grid container spacing={1}>
            <Grid item>
              <Avatar src={review.userAvatar || sofiaUrl} />
            </Grid>
            <Grid item>
              <Typography>{review.username || 'sofIA'}</Typography>
            </Grid>
            <Grid item>
              <Rating name="read-only" value={review.rating} readOnly />
            </Grid>
          </Grid>
        </CardContent>
      <CardContent>
        <Typography sx={{fontWeight:'bold'}}>{review.title}</Typography>
        <Typography>{review.description}</Typography>
      </CardContent>
      <CardActions>
        {review.url && (
          <Link href={review.url} target="_blank">
            <Button size="small">View</Button>
          </Link>
        )}
      </CardActions>
    </Card>
  );
}
