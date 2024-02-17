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
} from '@mui/material';

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography>Type: {review.type}</Typography>
      </CardContent>
      {review.username ||
        (review.userAvatar && (
          <CardContent>
            <Grid container>
              {review.userAvatar && (
                <Grid itemScope>
                  <Avatar src={review.userAvatar} />
                </Grid>
              )}
              {review.username && (
                <Grid item>
                  <Typography>{review.username}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        ))}
      <CardContent>
        <Typography>Rating: {review.rating}/5</Typography>
      </CardContent>
      <CardContent>
        <Typography>{review.title}</Typography>
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
