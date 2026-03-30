'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SliderItem {
  id: string
  image: string
  title?: string
  description?: string
  link?: string
  order: number
}

interface HeroSliderProps {
  items: SliderItem[]
}

export default function HeroSlider({ items }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goTo = useCallback((index: number) => {
    if (isTransitioning || items.length === 0) return
    setIsTransitioning(true)
    setCurrent(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning, items.length])

  const next = useCallback(() => {
    goTo((current + 1) % items.length)
  }, [current, items.length, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + items.length) % items.length)
  }, [current, items.length, goTo])

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [next, items.length])

  if (!items.length) {
    return (
      <div className="relative w-full h-[500px] md:h-[600px] bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-secondary">Erzurum</span> Üniversiteli<br />Gençler SK
          </h1>
          <p className="text-xl text-gray-300">Sporda mükemmeliyetin adresi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[400px] md:h-[560px] overflow-hidden bg-primary">
      {/* Slides */}
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={item.image}
              alt={item.title || 'Slider'}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          {(item.title || item.description) && (
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="max-w-xl">
                  {item.title && (
                    <h1
                      className={`text-3xl md:text-5xl font-black text-white mb-4 leading-tight transition-all duration-700 ${
                        index === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                      }`}
                    >
                      {item.title}
                    </h1>
                  )}
                  {item.description && (
                    <p
                      className={`text-gray-200 text-lg mb-6 transition-all duration-700 delay-100 ${
                        index === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                      }`}
                    >
                      {item.description}
                    </p>
                  )}
                  {item.link && (
                    <Link
                      href={item.link}
                      className={`inline-flex items-center gap-2 px-6 py-3 bg-secondary text-primary font-bold rounded-lg hover:bg-secondary-600 transition-all duration-700 delay-200 ${
                        index === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                      }`}
                    >
                      Devamını Oku
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === current
                  ? 'bg-secondary w-8 h-2.5'
                  : 'bg-white/50 hover:bg-white w-2.5 h-2.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
