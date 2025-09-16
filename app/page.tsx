import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Code, Palette, Zap } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Code className="h-5 w-5" />,
      title: 'Next.js 14',
      description: 'Latest Next.js with App Router and TypeScript support'
    },
    {
      icon: <Palette className="h-5 w-5" />,
      title: 'Tailwind CSS',
      description: 'Utility-first CSS framework with shadcn/ui components'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Developer Experience',
      description: 'ESLint, Prettier, and TypeScript configured for optimal DX'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <CheckCircle className="h-3 w-3 mr-1" />
            Project Ready
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-400">
            Memora Frontend
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your Next.js 14 application is successfully configured with TypeScript, 
            Tailwind CSS, and shadcn/ui components.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {feature.icon}
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="mr-4">
            Get Started
          </Button>
          <Button size="lg" variant="outline">
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  )
}