'use client';
import {
  Box,
  Divider,
  Drawer,
  DrawerProps,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import ReviewsIcon from '@mui/icons-material/Reviews';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GroupIcon from '@mui/icons-material/Group';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth.store';
import InfoIcon from '@mui/icons-material/Info';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { UserRole } from '../entities/user.entity';
export default function Sidebar(props: DrawerProps) {
  const { ...other } = props;
  const router = useRouter();
  const { user } = useAuthStore();

  const categories = [];
  if (user?.rol === UserRole.SUPERADMIN) {
    categories.push(
      {
        id: 'Scrapper',
        children: [
          {
            id: 'Products',
            icon: <CategoryIcon />,
            url: '/products',
          },
          {
            id: 'Requests',
            icon: <FormatListBulletedIcon />,
            url: '/requests',
          },
          { id: 'Prompts', icon: <SmartToyIcon />, url: '/prompts' },
        ],
      },
      {
        id: 'Users',
        children: [
          { id: 'Users', icon: <GroupIcon />, url: '/users' },
          { id: 'Companies', icon: <ApartmentIcon />, url: '/companies' },
        ],
      },
      {
        id: 'Admin',
        children: [
          {
            id: 'Api doc',
            icon: <InfoIcon />,
            url: `${process.env.NEXT_PUBLIC_API_URL}/api`,
          },
        ],
      },
    );
  }

  if (user?.rol === UserRole.MANAGER) {
    categories.push({
      id: 'Portfolio',
      children: [
        {
          id: 'Products',
          icon: <CategoryIcon />,
          url: '/products',
        },
        { id: 'Reviews', icon: <ReviewsIcon />, url: '/reviews' },
      ],
    });
  }

  const item = {
    py: '2px',
    px: 3,
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover, &:focus': {
      bgcolor: 'rgba(255, 255, 255, 0.08)',
    },
  };

  const itemCategory = {
    boxShadow: '0 -1px 0 rgb(255,255,255,0.1) inset',
    py: 1.5,
    px: 3,
  };

  return (
    <>
      <Drawer variant="permanent" {...other} sx={{ backgroundColor: 'black' }}>
        <List disablePadding sx={{ backgroundColor: 'black' }}>
          <ListItem
            sx={{
              ...item,
              ...itemCategory,
              fontSize: 22,
              color: '#FF6000',
              backgroundColor: 'black',
            }}
          >
            Reviews Hub
          </ListItem>
          {categories.map(({ id, children }) => (
            <Box key={id} sx={{ bgcolor: 'black' }}>
              <ListItem sx={{ py: 2, px: 3 }}>
                <ListItemText sx={{ color: '#fff' }}>{id}</ListItemText>
              </ListItem>
              {children.map((category) => (
                <ListItem disablePadding key={category.id}>
                  <ListItemButton
                    sx={item}
                    onClick={() => {
                      if (category.url.includes('http')) {
                        window.open(category.url, '_blank');
                        return;
                      }
                      router.push(category.url);
                    }}
                  >
                    <ListItemIcon sx={{ color: '#FF6000' }}>
                      {category.icon}
                    </ListItemIcon>
                    <ListItemText>{category.id}</ListItemText>
                  </ListItemButton>
                </ListItem>
              ))}
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </List>
      </Drawer>
    </>
  );
}
