import type { ComponentProps } from 'react'
import { navigate, routeHref } from '../lib/router'

type LinkProps = Omit<ComponentProps<'a'>, 'href'> & { to: string }

export function Link({ to, onClick, target, download, ...props }: LinkProps) {
  const href = routeHref(to)
  return (
    <a
      {...props}
      href={href}
      target={target}
      download={download}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (target && target !== '_self') ||
          (download !== undefined && download !== false)
        )
          return
        event.preventDefault()
        navigate(href)
      }}
    />
  )
}
