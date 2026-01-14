import React from 'react'
import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'

interface ModernIconProps {
    iconName: string
    size?: number
    gradient?: string
    className?: string
    color?: string
}

const iconMapping: Record<string, keyof typeof LucideIcons> = {
    workspace: 'Briefcase',
    retbuild: 'Hammer',
    founders: 'Rocket',
    code: 'Code2',
    academy: 'GraduationCap',
    gamedev: 'Gamepad2',
    stock: 'Image',
    gaming: 'Trophy',
    'kds-browser': 'Globe',
    'file-explorer': 'Folder',
    appstore: 'ShoppingBag',
    'app-store': 'ShoppingBag',
    settings: 'Settings',
    calculator: 'Calculator',
    calendar: 'Calendar',
    'calendar-app': 'Calendar',
    terminal: 'Terminal',
    cmd: 'Terminal',
    notes: 'StickyNote',
    layoutgrid: 'LayoutGrid',
    wifi: 'Wifi',
    wifioff: 'WifiOff',
    volumex: 'VolumeX',
    volume2: 'Volume2',
    palette: 'Palette',
    info: 'Info',
    refreshccw: 'RefreshCcw',
    folderplus: 'FolderPlus',
    arrowup: 'ArrowUp',
    home: 'Home',
    list: 'List',
    filetext: 'FileText',
    sparkles: 'Sparkles',
    send: 'Send',
    mic: 'Mic'
}

const defaultGradients: Record<string, string> = {
    workspace: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    retbuild: 'linear-gradient(135deg, #10b981, #059669)',
    founders: 'linear-gradient(135deg, #f59e0b, #d97706)',
    code: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    academy: 'linear-gradient(135deg, #ef4444, #dc2626)',
    gamedev: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    stock: 'linear-gradient(135deg, #6b7280, #4b5563)',
    gaming: 'linear-gradient(135deg, #ec4899, #db2777)',
    'kds-browser': 'linear-gradient(135deg, #06b6d4, #0891b2)',
    'file-explorer': 'linear-gradient(135deg, #facc15, #eab308)',
    'app-store': 'linear-gradient(135deg, #d946ef, #c026d3)',
    appstore: 'linear-gradient(135deg, #d946ef, #c026d3)',
    settings: 'linear-gradient(135deg, #94a3b8, #64748b)',
    calculator: 'linear-gradient(135deg, #475569, #1e293b)',
    calendar: 'linear-gradient(135deg, #f87171, #ef4444)',
    notes: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    mic: 'linear-gradient(135deg, #ef4444, #f87171)'
}

export const ModernIcon = ({
    iconName,
    size = 48,
    gradient,
    className,
    color
}: ModernIconProps): React.ReactElement => {
    const lucideKey = iconMapping[iconName.toLowerCase()]
    const IconComponent = lucideKey ? (LucideIcons[lucideKey] as React.FC<LucideProps>) : null
    const background =
        gradient ||
        defaultGradients[iconName.toLowerCase()] ||
        'linear-gradient(135deg, #6366f1, #4f46e5)'

    return (
        <div
            className={`modern-icon-container ${className || ''}`}
            style={{
                width: size,
                height: size,
                background
            }}
        >
            <div className="gel-reflection" />
            <div className="gel-icon-inner-glow" />
            {IconComponent ? (
                <IconComponent size={size * 0.55} className="modern-icon-svg" strokeWidth={2.5} color={color} />
            ) : (
                <span
                    style={{
                        fontSize: size * 0.5,
                        zIndex: 3,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                >
                    {iconName}
                </span>
            )}
        </div>
    )
}
