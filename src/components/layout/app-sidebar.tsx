'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookHeart,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  SmilePlus,
  Sparkles,
  LogOut,
  LogIn
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/check-in', label: 'Daily Check-in', icon: SmilePlus },
  { href: '/progress', label: 'My Progress', icon: LineChart },
  { href: '/resources', label: 'Resources', icon: BookHeart },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
        await auth.signOut();
        router.push('/login');
    }
  };

  const getUserInitial = () => {
    if (!user) return 'G';
    if (user.isAnonymous) return 'A';
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  }

  const getUserName = () => {
    if (!user) return 'Guest';
    if (user.isAnonymous) return 'Anonymous User';
    return user.displayName || user.email || 'User';
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold font-headline">ManasMitra</h1>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {isUserLoading ? (
            <div className="flex items-center gap-3 p-2">
                <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold truncate">Loading...</span>
                </div>
            </div>
        ) : user ? (
          <div className="flex items-center justify-between p-2 w-full">
            <div className="flex items-center gap-3 overflow-hidden">
                <Avatar>
                <AvatarImage
                    src={user.photoURL || userAvatar?.imageUrl}
                    data-ai-hint={userAvatar?.imageHint}
                />
                <AvatarFallback>{getUserInitial()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{getUserName()}</span>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Login">
                        <Link href="/login">
                            <LogIn/>
                            <span>Login</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
