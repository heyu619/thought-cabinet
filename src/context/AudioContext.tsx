'use client'

import { createContext, useContext, useRef, useEffect, useState, useCallback, type ReactNode } from 'react'

interface AudioContextType {
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  togglePlay: () => void
  setVolume: (volume: number) => void
  seekTo: (percent: number) => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(180)
  const [volume, setVolume] = useState(70)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 初始化音频
  useEffect(() => {
    const audio = new Audio('/audio/Instrument of Surrender.mp3')
    audio.volume = volume / 100
    audio.loop = true // 循环播放
    audioRef.current = audio

    const updateProgress = () => {
      if (audioRef.current && audioRef.current.duration) {
        const newProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100
        setProgress(newProgress)
      }
    }

    const updateDuration = () => {
      if (audioRef.current && audioRef.current.duration) {
        setDuration(Math.floor(audioRef.current.duration))
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
      audio.src = ''
    }
  }, [])

  // 音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => console.error('播放失败:', e))
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const seekTo = useCallback((percent: number) => {
    if (!audioRef.current) return
    const newProgress = Math.max(0, Math.min(100, percent))
    setProgress(newProgress)
    if (audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration
    }
  }, [])

  return (
    <AudioContext.Provider value={{
      isPlaying,
      progress,
      duration,
      volume,
      togglePlay,
      setVolume,
      seekTo
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
