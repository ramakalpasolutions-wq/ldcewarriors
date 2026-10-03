'use client'

export default function VideoCard({
  video,
  onClick,
  isSubscribed = false,
  playCount = 0,
}) {
  const videoId = video._id || video.id

  /* ─────────────────────────────────────
     PLAY COUNT

     MongoDB playCount = USED plays

     0 used = 3 left
     1 used = 2 left
     2 used = 1 left
     3 used = 0 left
  ───────────────────────────────────── */

  const usedPlays = Math.max(
    0,
    Number(playCount) || 0
  )

  const playLimit =
    Number(video.playLimit) > 0
      ? Number(video.playLimit)
      : 3

  const remainingPlays = Math.max(
    0,
    playLimit - usedPlays
  )

  /* ─────────────────────────────────────
     VIDEO TYPE
  ───────────────────────────────────── */

  const videoType =
    video.type?.toLowerCase()?.trim()

  const isJoinFamily =
    videoType === 'premium' ||
    videoType === 'join family'

  /* ─────────────────────────────────────
     ACCESS
  ───────────────────────────────────── */

  const isMembershipLocked =
    isJoinFamily &&
    !isSubscribed

  const isLimitReached =
    isJoinFamily &&
    isSubscribed &&
    usedPlays >= playLimit

  const canPlay =
    !isMembershipLocked &&
    !isLimitReached

  /* ─────────────────────────────────────
     CLICK
  ───────────────────────────────────── */

  function handleClick() {
    onClick?.({
      ...video,
      _id: videoId,
    })
  }

  return (
    <>
      <style>{`
        .vc-root {
          position: relative;

          display: flex;
          flex-direction: column;

          height: 100%;

          overflow: hidden;

          background: #FFFFFF;

          border:
            1.5px solid #E5E7EB;

          border-radius: 14px;

          cursor: pointer;

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .vc-root:hover {
          transform:
            translateY(-4px);

          box-shadow:
            0 12px 32px
            rgba(0,0,0,0.09);

          border-color:
            rgba(232,168,56,0.35);
        }

        .vc-root.limit {
          border-color:
            rgba(239,68,68,0.25);
        }

        /* ═══════════════════════════════
           THUMBNAIL
        ═══════════════════════════════ */

        .vc-thumb {
          position: relative;

          width: 100%;

          aspect-ratio: 16 / 9;

          overflow: hidden;

          background: #F3F4F6;
        }

        .vc-thumb img {
          display: block;

          width: 100%;
          height: 100%;

          object-fit: cover;

          transition:
            transform 0.45s ease;
        }

        .vc-root:hover .vc-thumb img {
          transform:
            scale(1.05);
        }

        /*
         * IMPORTANT:
         *
         * No blur.
         * No lock.
         * No FAMILY badge.
         * No star.
         * No Join Family overlay.
         *
         * Thumbnail always stays clean.
         */

        .vc-thumb-grad {
          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: 35%;

          pointer-events: none;

          background:
            linear-gradient(
              to top,
              rgba(0,0,0,0.16),
              transparent
            );
        }

        /* ═══════════════════════════════
           DURATION
        ═══════════════════════════════ */

        .vc-duration {
          position: absolute;

          right: 8px;
          bottom: 8px;

          z-index: 3;

          padding:
            3px 7px;

          color: #FFFFFF;

          background:
            rgba(15,20,30,0.78);

          border-radius: 6px;

          font-size: 10px;
          font-weight: 600;

          backdrop-filter:
            blur(4px);
        }

        /* ═══════════════════════════════
           PLAY BUTTON
        ═══════════════════════════════ */

        .vc-play {
          position: absolute;

          inset: 0;

          z-index: 4;

          display: flex;

          align-items: center;
          justify-content: center;

          opacity: 0;

          pointer-events: none;

          transition:
            opacity 0.25s ease;
        }

        .vc-root:hover .vc-play {
          opacity: 1;
        }

        .vc-play-circle {
          display: flex;

          align-items: center;
          justify-content: center;

          width: 48px;
          height: 48px;

          border-radius: 50%;

          background:
            rgba(27,42,74,0.90);

          box-shadow:
            0 4px 20px
            rgba(0,0,0,0.35);

          backdrop-filter:
            blur(6px);

          transition:
            transform 0.2s ease;
        }

        .vc-root:hover
        .vc-play-circle {
          transform:
            scale(1.08);
        }

        /* ═══════════════════════════════
           INFORMATION
        ═══════════════════════════════ */

        .vc-info {
          display: flex;

          flex-direction: column;

          flex: 1;

          gap: 9px;

          padding:
            12px 14px 14px;
        }

        /* ═══════════════════════════════
           FREE BADGE
        ═══════════════════════════════ */

        .vc-free-badge {
          display: inline-flex;

          align-items: center;

          width: fit-content;

          padding:
            3px 8px;

          border:
            1px solid
            rgba(42,157,143,0.25);

          border-radius: 6px;

          background:
            rgba(42,157,143,0.10);

          color: #2A9D8F;

          font-size: 9px;

          font-weight: 700;

          letter-spacing:
            0.2px;

          white-space: nowrap;
        }

        /* ═══════════════════════════════
           TITLE
        ═══════════════════════════════ */

        .vc-title-row {
          display: flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap: 8px;
        }

        .vc-title {
          flex: 1;

          min-width: 0;

          margin: 0;

          color: #1A1D23;

          font-size: 13px;

          font-weight: 700;

          line-height: 1.45;

          display:
            -webkit-box;

          -webkit-line-clamp: 2;

          -webkit-box-orient:
            vertical;

          overflow: hidden;

          transition:
            color 0.2s ease;
        }

        .vc-root:hover
        .vc-title {
          color: #1B2A4A;
        }

        .vc-title.limit-color {
          color: #9CA3AF;
        }

        /* ═══════════════════════════════
           JOIN FAMILY LOCK
           ONLY BESIDE TITLE
        ═══════════════════════════════ */

        .vc-join-lock {
          display: inline-flex;

          align-items: center;

          gap: 4px;

          flex-shrink: 0;

          padding:
            4px 8px;

          border:
            1px solid
            rgba(232,168,56,0.32);

          border-radius:
            999px;

          background:
            rgba(232,168,56,0.10);

          color: #C98619;

          font-size: 9px;

          font-weight: 700;

          white-space: nowrap;
        }

        /* ═══════════════════════════════
           META
        ═══════════════════════════════ */

        .vc-meta {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 8px;

          flex-wrap: wrap;

          margin-top: auto;
        }

        .vc-topic-chip {
          max-width: 140px;

          overflow: hidden;

          padding:
            3px 9px;

          border:
            1px solid
            rgba(27,42,74,0.10);

          border-radius:
            999px;

          background:
            rgba(27,42,74,0.06);

          color: #1B2A4A;

          font-size: 10px;

          font-weight: 600;

          white-space: nowrap;

          text-overflow:
            ellipsis;
        }

        /* ═══════════════════════════════
           PLAY COUNT
        ═══════════════════════════════ */

        .vc-play-status {
          display: flex;

          align-items: center;

          gap: 6px;
        }

        .vc-plays-dots {
          display: flex;

          align-items: center;

          gap: 3px;
        }

        .vc-dot {
          width: 6px;
          height: 6px;

          border-radius:
            50%;
        }

        .vc-remaining {
          font-size: 9px;

          font-weight: 700;

          white-space: nowrap;
        }

        /* ═══════════════════════════════
           LIMIT REACHED
        ═══════════════════════════════ */

        .vc-limit {
          display: inline-flex;

          align-items: center;

          width: fit-content;

          padding:
            3px 7px;

          border-radius:
            999px;

          background:
            rgba(239,68,68,0.08);

          color: #EF4444;

          font-size: 9px;

          font-weight: 700;

          white-space: nowrap;
        }

        /* ═══════════════════════════════
           MOBILE
        ═══════════════════════════════ */

        @media
        (max-width: 640px) {

          .vc-info {
            padding:
              10px 11px 12px;
          }

          .vc-title {
            font-size: 12px;
          }

          .vc-join-lock {
            padding:
              3px 6px;

            font-size: 8px;
          }

          .vc-topic-chip {
            font-size: 9px;
          }

          .vc-remaining {
            font-size: 8px;
          }
        }
      `}</style>

      <div
        className={`vc-root${
          isLimitReached
            ? ' limit'
            : ''
        }`}
        onClick={handleClick}
      >

        {/* ═════════════════════════════
            CLEAN THUMBNAIL
        ═════════════════════════════ */}

        <div className="vc-thumb">

          <img
            src={
              video.thumbnail ||
              'https://via.placeholder.com/640x360/1B2A4A/E8A838?text=LDCE+Video'
            }
            alt={
              video.title ||
              'LDCE Video'
            }
          />

          <div
            className="vc-thumb-grad"
          />

          {/* Duration */}

          {video.duration && (
            <div
              className="vc-duration"
            >
              {video.duration}
            </div>
          )}

          {/*

            PLAY BUTTON

            FREE:
            show play button

            FAMILY MEMBER:
            show play button

            NON FAMILY:
            thumbnail remains completely
            clean — no lock / no star /
            no Family overlay.

          */}

          {canPlay && (
            <div
              className="vc-play"
            >
              <div
                className="vc-play-circle"
              >
                <svg
                  width="20"
                  height="20"
                  fill="#E8A838"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 5v14l11-7z"
                  />
                </svg>
              </div>
            </div>
          )}

        </div>

        {/* ═════════════════════════════
            CARD INFORMATION
        ═════════════════════════════ */}

        <div className="vc-info">

          {/* FREE VIDEO */}

          {!isJoinFamily && (
            <span
              className="vc-free-badge"
            >
              FREE
            </span>
          )}

          {/* ═══════════════════════════
              TITLE
          ═══════════════════════════ */}

          <div
            className="vc-title-row"
          >

            <h3
              className={`vc-title${
                isLimitReached
                  ? ' limit-color'
                  : ''
              }`}
            >
              {video.title}
            </h3>

            {/*

              Only show lock near title
              when user has NOT joined.

              NO STAR.
              NO FAMILY badge after joining.

            */}

            {isMembershipLocked && (
              <span
                className="vc-join-lock"
              >
                🔒 Join Family
              </span>
            )}

          </div>

          {/* ═══════════════════════════
              META
          ═══════════════════════════ */}

          <div
            className="vc-meta"
          >

            {(video.topicId?.name ||
              video.topic?.name) && (

              <span
                className="vc-topic-chip"
              >
                {video.topicId?.name ||
                  video.topic?.name}
              </span>

            )}

            {/* ═════════════════════════
                SUBSCRIBED USER
                PLAY COUNT
            ═════════════════════════ */}

            {isJoinFamily &&
              isSubscribed && (

                <div
                  className="vc-play-status"
                >

                  <div
                    className="vc-plays-dots"
                  >

                    {Array(playLimit)
                      .fill(null)
                      .map((_, i) => {

                        const available =
                          i <
                          remainingPlays

                        return (
                          <div
                            key={i}

                            className="vc-dot"

                            style={{
                              background:
                                available
                                  ? '#E8A838'
                                  : '#E5E7EB',
                            }}
                          />
                        )
                      })}

                  </div>

                  <span
                    className="vc-remaining"

                    style={{
                      color:
                        remainingPlays === 0
                          ? '#EF4444'
                          : remainingPlays === 1
                            ? '#F59E0B'
                            : '#6B7280',
                    }}
                  >
                    {remainingPlays}
                    /
                    {playLimit}
                    {' '}left
                  </span>

                </div>

              )}

          </div>

          {/* ═══════════════════════════
              LIMIT MESSAGE
          ═══════════════════════════ */}

          {isLimitReached && (
            <span
              className="vc-limit"
            >
              Play limit reached
            </span>
          )}

        </div>
      </div>
    </>
  )
}