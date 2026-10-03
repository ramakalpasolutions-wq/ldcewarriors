// src/app/api/admin/hero/route.js

import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { deleteImage } from '@/lib/cloudinary'
import { deleteVideoFromR2 } from '@/lib/r2'

export const dynamic = 'force-dynamic'

/* =========================================================
   ADMIN AUTH
========================================================= */

function requireAdmin(req) {
  try {
    const token =
      req.cookies.get('adminToken')?.value ||
      req.cookies.get('admin_token')?.value ||
      req.cookies.get('token')?.value

    if (!token) return null

    const decoded = verifyToken(token)

    if (!decoded) return null

    return decoded?.role?.toLowerCase() === 'admin'
      ? decoded
      : null
  } catch (error) {
    console.error('Admin auth error:', error)
    return null
  }
}

/* =========================================================
   DELETE OLD MEDIA
========================================================= */

async function deleteHeroMedia(hero) {
  if (!hero) return

  try {
    if (
      hero.type === 'video' &&
      hero.videoKey
    ) {
      await deleteVideoFromR2(hero.videoKey)

      console.log(
        `✅ Old R2 video deleted: ${hero.videoKey}`
      )

      return
    }

    if (
      hero.type !== 'video' &&
      hero.mediaPublicId
    ) {
      await deleteImage(hero.mediaPublicId)

      console.log(
        `✅ Old Cloudinary image deleted: ${hero.mediaPublicId}`
      )
    }
  } catch (error) {
    /*
      Do not fail the whole database update/delete
      just because cloud cleanup failed.
    */

    console.warn(
      '⚠️ Hero media cleanup failed:',
      error?.message || error
    )
  }
}

/* =========================================================
   GET HERO SLIDES
========================================================= */

export async function GET(req) {
  try {
    /*
      Public GET is kept here because your homepage may also
      use this endpoint.

      It only returns active slides.
    */

    const items = await prisma.hero.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        order: 'asc',
      },
    })

    const mapped = items.map((item) => ({
      ...item,
      _id: item.id,
    }))

    return NextResponse.json({
      success: true,
      items: mapped,
    })
  } catch (error) {
    console.error(
      'Hero GET error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to fetch hero content',
      },
      {
        status: 500,
      }
    )
  }
}

/* =========================================================
   CREATE HERO SLIDE
========================================================= */

export async function POST(req) {
  try {
    const admin = requireAdmin(req)

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const body = await req.json()

    const {
      type = 'image',
      title,
      order = 0,

      // Already uploaded by browser
      mediaUrl,
      mediaPublicId,
      videoKey,
    } = body

    /* -------------------------
       VALIDATION
    ------------------------- */

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required',
        },
        {
          status: 400,
        }
      )
    }

    if (!mediaUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Media URL is required',
        },
        {
          status: 400,
        }
      )
    }

    const allowedTypes = [
      'image',
      'video',
      'article',
    ]

    const cleanType =
      allowedTypes.includes(type)
        ? type
        : 'image'

    /* -------------------------
       CREATE
    ------------------------- */

    const hero =
      await prisma.hero.create({
        data: {
          type: cleanType,

          title:
            title.trim(),

          subtitle: null,

          mediaUrl,

          mediaPublicId:
            mediaPublicId || null,

          videoKey:
            videoKey || null,

          ctaText: null,
          ctaLink: null,

          order:
            Number.parseInt(
              order,
              10
            ) || 0,

          isActive: true,
        },
      })

    console.log(
      `✅ Hero slide created — ${hero.id}`
    )

    return NextResponse.json(
      {
        success: true,

        hero: {
          ...hero,
          _id: hero.id,
        },
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'Hero POST error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to create hero item',
      },
      {
        status: 500,
      }
    )
  }
}

/* =========================================================
   UPDATE / EDIT HERO SLIDE
========================================================= */

export async function PUT(req) {
  try {
    const admin = requireAdmin(req)

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const body = await req.json()

    const {
      id,
      type,
      title,
      order,

      mediaUrl,
      mediaPublicId,
      videoKey,

      isActive,
    } = body

    /* -------------------------
       VALIDATION
    ------------------------- */

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hero ID is required',
        },
        {
          status: 400,
        }
      )
    }

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required',
        },
        {
          status: 400,
        }
      )
    }

    if (!mediaUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Media URL is required',
        },
        {
          status: 400,
        }
      )
    }

    /* -------------------------
       FIND EXISTING SLIDE
    ------------------------- */

    const existing =
      await prisma.hero.findUnique({
        where: {
          id,
        },
      })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hero slide not found',
        },
        {
          status: 404,
        }
      )
    }

    /* -------------------------
       TYPE
    ------------------------- */

    const allowedTypes = [
      'image',
      'video',
      'article',
    ]

    const cleanType =
      allowedTypes.includes(type)
        ? type
        : existing.type

    /* =====================================================
       DETECT MEDIA CHANGE

       Important:

       If admin only changes:
       - title
       - order

       old media should NOT be deleted.

       Old media is deleted only if a different uploaded
       media file replaced it.
    ===================================================== */

    const mediaChanged =
      mediaUrl !== existing.mediaUrl ||
      mediaPublicId !==
        existing.mediaPublicId ||
      videoKey !== existing.videoKey ||
      cleanType !== existing.type

    /* -------------------------
       UPDATE DATABASE
    ------------------------- */

    const updated =
      await prisma.hero.update({
        where: {
          id,
        },

        data: {
          type: cleanType,

          title:
            title.trim(),

          mediaUrl,

          mediaPublicId:
            mediaPublicId || null,

          videoKey:
            videoKey || null,

          order:
            Number.parseInt(
              order,
              10
            ) || 0,

          ...(typeof isActive ===
          'boolean'
            ? {
                isActive,
              }
            : {}),
        },
      })

    /* =====================================================
       DELETE OLD MEDIA

       Database update happens first.

       This prevents losing the current slide if database
       update fails.
    ===================================================== */

    if (mediaChanged) {
      await deleteHeroMedia(
        existing
      )
    }

    console.log(
      `✅ Hero slide updated — ${updated.id}`
    )

    return NextResponse.json({
      success: true,

      message:
        'Hero slide updated successfully',

      hero: {
        ...updated,
        _id: updated.id,
      },
    })
  } catch (error) {
    console.error(
      'Hero PUT error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to update hero slide',
      },
      {
        status: 500,
      }
    )
  }
}

/* =========================================================
   DELETE HERO SLIDE
========================================================= */

export async function DELETE(req) {
  try {
    const admin = requireAdmin(req)

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const { searchParams } =
      new URL(req.url)

    const id =
      searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID is required',
        },
        {
          status: 400,
        }
      )
    }

    /* -------------------------
       FIND SLIDE
    ------------------------- */

    const hero =
      await prisma.hero.findUnique({
        where: {
          id,
        },
      })

    if (!hero) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slide not found',
        },
        {
          status: 404,
        }
      )
    }

    /* =====================================================
       DELETE DATABASE RECORD FIRST

       Then clean up R2 / Cloudinary.

       This avoids the opposite problem where media gets
       deleted but DB deletion fails.
    ===================================================== */

    await prisma.hero.delete({
      where: {
        id,
      },
    })

    /* -------------------------
       CLOUD CLEANUP
    ------------------------- */

    await deleteHeroMedia(hero)

    console.log(
      `✅ Hero slide deleted — ${id}`
    )

    return NextResponse.json({
      success: true,
      message:
        'Hero slide deleted successfully',
    })
  } catch (error) {
    console.error(
      'Hero DELETE error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to delete slide',
      },
      {
        status: 500,
      }
    )
  }
}