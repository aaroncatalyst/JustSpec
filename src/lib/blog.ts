import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog')

export type Category =
  | 'china-sourcing'
  | 'us-manufacturing'
  | 'sourcing-strategy'
  | 'managed-sourcing'
  | 'tariffs-trade'

export interface BlogPost {
  title: string
  slug: string
  description: string
  publishedAt: string
  category: Category
  keywords: string[]
  content: string
}

function parsePost(filename: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  if (!data.title || !data.slug || !data.publishedAt || !data.category) {
    return null
  }

  return {
    title: data.title as string,
    slug: data.slug as string,
    description: (data.description as string) ?? '',
    publishedAt: data.publishedAt as string,
    category: data.category as Category,
    keywords: (data.keywords as string[]) ?? [],
    content,
  }
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

  const posts = files
    .map((f) => parsePost(f))
    .filter((p): p is BlogPost => p !== null)

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getPostBySlug(slug: string): BlogPost | null {
  const all = getAllPosts()
  return all.find((p) => p.slug === slug) ?? null
}

export function getPostsByCategory(category: Category): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category)
}

export function extractHeadings(content: string): Array<{ id: string; text: string }> {
  const lines = content.split('\n')
  const headings: Array<{ id: string; text: string }> = []

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/)
    if (match) {
      const text = match[1].trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
      headings.push({ id, text })
    }
  }

  return headings
}
