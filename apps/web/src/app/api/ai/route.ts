import { publicAgentCatalog } from '@/lib/public-surfaces';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return Response.json(publicAgentCatalog(origin), {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  });
}
