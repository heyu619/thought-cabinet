'use client'

import { useState, useRef } from 'react'
import { useAudio } from '@/context/AudioContext'

const FloatingPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const {
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    setVolume,
    seekTo
  } = useAudio()

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 处理进度条拖拽
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    seekTo(percent)
  }

  // 生成波形条
  const renderWaveform = () => {
    const bars = 20
    return Array.from({ length: bars }).map((_, i) => {
      const height = isPlaying ? Math.random() * 100 : 30 + Math.sin(i * 0.5) * 20
      return (
        <div
          key={i}
          className="waveform-bar bg-cabinet-accent rounded-full transition-all duration-150"
          style={{
            height: `${Math.max(10, height)}%`,
            animationDelay: `${i * 50}ms`
          }}
        />
      )
    })
  }

  return (
    <div
      className="floating-player"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* 迷你模式 - 波形动画 */}
      <div className="player-mini">
        <button
          className="play-btn"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <div className="waveform-container">
          {renderWaveform()}
        </div>
      </div>

      {/* 展开模式 - 完整控制栏 */}
      <div className={`player-expanded ${isExpanded ? 'expanded' : ''}`}>
        <div className="player-content">
          {/* 进度条 */}
          <div className="progress-section">
            <span className="time-text">{formatTime((progress / 100) * duration)}</span>
            <div
              ref={progressRef}
              className="progress-bar"
              onClick={handleProgressClick}
            >
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
              <div
                className="progress-thumb"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="time-text">{formatTime(duration)}</span>
          </div>

          {/* 音量控制 */}
          <div className="volume-section">
            <svg className="volume-icon" viewBox="0 0 24 24" fill="currentColor">
              {volume === 0 ? (
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
              ) : volume < 50 ? (
                <path d="M3,9V15H7L12,20V4L7,9H3M16.5,12C16.5,10.89 15.61,10 14.5,10H13V14H14.5C15.61,14 16.5,13.1 16.5,12M20.5,12C20.5,10.89 19.61,10 18.5,10H17V14H18.5C19.61,14 20.5,13.1 20.5,12Z" />
              ) : (
                <path d="M3,9V15H7L12,20V4L7,9H3M14,4L19,9V15L14,20H5V4H14M16.5,10.5A1.5,1.5 0 0,1 18,12A1.5,1.5 0 0,1 16.5,13.5A1.5,1.5 0 0,1 15,12A1.5,1.5 0 0,1 16.5,10.5M20.5,7A1.5,1.5 0 0,1 22,8.5A1.5,1.5 0 0,1 20.5,10A1.5,1.5 0 0,1 19,8.5A1.5,1.5 0 0,1 20.5,7M19,13.5A1.5,1.5 0 0,1 20.5,15A1.5,1.5 0 0,1 19,16.5A1.5,1.5 0 0,1 17.5,15A1.5,1.5 0 0,1 19,13.5Z" />
              )}
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FloatingPlayer
