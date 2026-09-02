import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = ({ events, onSelectEvent, onSelectSlot }) => {
    const dayPropGetter = (date) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (date < now) {
            return {
                className: 'rbc-past-date'
            };
        }
        return {};
    };

    return (
        <div className="calendar-container">
            <Calendar
                localizer={localizer}
                dayPropGetter={dayPropGetter}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                selectable={!!onSelectSlot}
                views={['month', 'week', 'day']}
                defaultView="month"
                defaultDate={new Date()}
            />
        </div>
    );
};

export default CalendarView;
