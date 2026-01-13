import React, { useState } from 'react';

export const CalendarApp = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const days: React.ReactNode[] = [];

        // Padding for the first week
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ width: '100%', aspectRatio: '1/1' }}></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            days.push(
                <div key={i} style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday ? 'var(--accent-color)' : 'transparent',
                    color: isToday ? 'white' : '#333',
                    fontWeight: isToday ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '14px',
                }}
                    onMouseEnter={(e) => !isToday && (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => !isToday && (e.currentTarget.style.background = 'transparent')}
                >
                    {i}
                </div>
            );
        }
        return days;
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const navBtnStyle: React.CSSProperties = {
        background: 'rgba(0,0,0,0.03)',
        border: 'none',
        borderRadius: '10px',
        width: '36px',
        height: '36px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        transition: 'all 0.2s'
    };

    return (
        <div style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#000' }}>
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => changeMonth(-1)} style={navBtnStyle}>◀</button>
                    <button onClick={() => changeMonth(1)} style={navBtnStyle}>▶</button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '12px',
                color: 'rgba(0,0,0,0.3)',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px',
                flex: 1
            }}>
                {renderDays()}
            </div>

            <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(255,255,255,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, marginBottom: '10px', color: '#000' }}>UPCOMING EVENTS</div>
                <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#666' }}>No events scheduled for this month.</div>
            </div>
        </div>
    );
};
