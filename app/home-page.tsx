'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { 
  TrendingUp, 
  Users, 
  Plus, 
  BarChart3, 
  Zap, 
  Star,
  ArrowRight,
  Globe,
  Lock,
  MessageSquare
} from 'lucide-react';

interface FeaturedPoll {
  id: string;
  title: string;
  description: string;
  votesCount: number;
  optionsCount: number;
  createdBy: string;
  isPublic: boolean;
  hasEnded: boolean;
}

interface HomePageStats {
  totalPolls: number;
  totalVotes: number;
  activeUsers: number;
  trendingPolls: FeaturedPoll[];
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<HomePageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch homepage data
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Fetch trending polls
        const response = await fetch('/api/polls?sort=popular&limit=6');
        const data = await response.json();
        
        setStats({
          totalPolls: data.total || 0,
          totalVotes: data.polls?.reduce((sum: number, poll: any) => sum + poll.votesCount, 0) || 0,
          activeUsers: Math.floor(Math.random() * 1000) + 500, // Mock data
          trendingPolls: data.polls || [],
        });
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Polls",
      description: "Create and share polls in seconds with our intuitive interface"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Real-time Results",
      description: "Watch results update live as people vote on your polls"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Public & Private",
      description: "Share polls publicly or keep them private for your community"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community Driven",
      description: "Join thousands of users creating engaging polls and discussions"
    }
  ];

  const quickActions = [
    {
      title: "Create Poll",
      description: "Start a new poll",
      icon: <Plus className="h-5 w-5" />,
      href: "/polls/create",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Browse Polls",
      description: "Discover trending polls",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/polls",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "View Results",
      description: "See poll analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/polls",
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <Badge variant="outline" className="mb-4">
                <Star className="h-4 w-4 mr-1" />
                Welcome to ALX Poll
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Create, Share & Vote
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The ultimate platform for creating engaging polls, gathering opinions, 
              and making data-driven decisions with your community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <>
                  <Link href="/polls/create">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Poll
                    </Button>
                  </Link>
                  <Link href="/polls">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Explore Polls
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Users className="h-5 w-5 mr-2" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : stats?.totalPolls || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Polls</div>
              </div>
              <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {loading ? '...' : stats?.totalVotes || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
              <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : stats?.activeUsers || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground">Live Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose ALX Poll?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make polling simple, engaging, and insightful
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quick Actions</h2>
            <p className="text-muted-foreground">
              Get started with these popular actions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{action.title}</h3>
                        <p className="text-muted-foreground text-sm">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Polls */}
      {stats?.trendingPolls && stats.trendingPolls.length > 0 && (
        <section className="py-16 bg-white/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Trending Polls</h2>
              <p className="text-muted-foreground">
                See what's popular in the community right now
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.trendingPolls.slice(0, 6).map((poll) => (
                <Link key={poll.id} href={`/polls/${poll.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-2 text-lg">{poll.title}</CardTitle>
                        <div className="flex gap-1">
                          {poll.isPublic ? (
                            <Globe className="h-4 w-4 text-green-600" title="Public" />
                          ) : (
                            <Lock className="h-4 w-4 text-orange-600" title="Private" />
                          )}
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {poll.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>by {poll.createdBy}</span>
                        <Badge variant={poll.hasEnded ? 'destructive' : 'default'}>
                          {poll.hasEnded ? 'Ended' : 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{poll.votesCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{poll.optionsCount}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Poll
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/polls">
                <Button variant="outline" size="lg">
                  View All Polls
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who are already creating engaging polls and making data-driven decisions.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/polls/create">
                <Button size="lg" variant="secondary">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Poll
                </Button>
              </Link>
              <Link href="/polls">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Explore Community
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary">
                  <Users className="h-5 w-5 mr-2" />
                  Sign Up Free
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 ALX Poll. Built with Next.js, Supabase, and ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}
