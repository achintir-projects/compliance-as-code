import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const regulators = await db.regulator.findMany({
      include: {
        bundles: {
          select: {
            id: true,
            downloads: true,
            reviews: {
              select: {
                rating: true
              }
            }
          }
        }
      }
    });

    const formattedRegulators = regulators.map(regulator => {
      const totalDownloads = regulator.bundles.reduce((sum, bundle) => sum + bundle.downloads, 0);
      const totalReviews = regulator.bundles.reduce((sum, bundle) => sum + bundle.reviews.length, 0);
      const avgRating = totalReviews > 0 
        ? regulator.bundles.reduce((sum, bundle) => {
            const bundleAvg = bundle.reviews.length > 0 
              ? bundle.reviews.reduce((rSum, review) => rSum + review.rating, 0) / bundle.reviews.length 
              : 0;
            return sum + bundleAvg;
          }, 0) / regulator.bundles.length 
        : 0;

      return {
        id: regulator.id,
        name: regulator.name,
        jurisdiction: regulator.jurisdiction,
        verified: regulator.verified,
        publishedBundles: regulator.bundles.length,
        joinDate: regulator.createdAt.toISOString(),
        rating: parseFloat(avgRating.toFixed(1))
      };
    });

    return NextResponse.json({
      regulators: formattedRegulators
    });
  } catch (error) {
    console.error('Error fetching regulators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regulators' },
      { status: 500 }
    );
  }
}