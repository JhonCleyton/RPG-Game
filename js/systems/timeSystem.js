class TimeSystem {
    constructor() {
        // Tempo do jogo (em minutos)
        this.currentTime = 360; // Começa às 6:00
        this.timeScale = 60; // 1 segundo real = 1 minuto no jogo
        
        // Ciclo dia/noite
        this.dayDuration = 1440; // 24 horas em minutos
        this.sunrise = 360;  // 6:00
        this.sunset = 1080;  // 18:00
        
        // Eventos agendados
        this.scheduledEvents = new Map();
        this.recurringEvents = new Set();
        
        // Callbacks
        this.onHourChange = new Set();
        this.onDayChange = new Set();
        this.onTimeOfDayChange = new Set();
    }

    update(deltaTime) {
        const previousHour = this.getHour();
        const previousDay = this.getDay();
        const previousTimeOfDay = this.getTimeOfDay();
        
        // Atualizar tempo
        this.currentTime += (deltaTime / 1000) * this.timeScale;
        
        // Manter dentro do ciclo de 24 horas
        if (this.currentTime >= this.dayDuration) {
            this.currentTime -= this.dayDuration;
        }
        
        // Verificar mudanças
        const currentHour = this.getHour();
        const currentDay = this.getDay();
        const currentTimeOfDay = this.getTimeOfDay();
        
        // Disparar eventos
        if (currentHour !== previousHour) {
            this.onHourChange.forEach(callback => callback(currentHour));
        }
        
        if (currentDay !== previousDay) {
            this.onDayChange.forEach(callback => callback(currentDay));
        }
        
        if (currentTimeOfDay !== previousTimeOfDay) {
            this.onTimeOfDayChange.forEach(callback => callback(currentTimeOfDay));
        }
        
        // Verificar eventos agendados
        this.checkScheduledEvents();
    }

    getHour() {
        return Math.floor(this.currentTime / 60);
    }

    getMinute() {
        return Math.floor(this.currentTime % 60);
    }

    getDay() {
        return Math.floor(this.currentTime / this.dayDuration);
    }

    getTimeString() {
        const hour = this.getHour().toString().padStart(2, '0');
        const minute = this.getMinute().toString().padStart(2, '0');
        return `${hour}:${minute}`;
    }

    getTimeOfDay() {
        if (this.currentTime >= this.sunrise && this.currentTime < this.sunset) {
            if (this.currentTime < this.sunrise + 120) return 'dawn';
            if (this.currentTime > this.sunset - 120) return 'dusk';
            return 'day';
        }
        return 'night';
    }

    getDaylightFactor() {
        const time = this.currentTime;
        
        // Dawn
        if (time >= this.sunrise - 60 && time < this.sunrise + 60) {
            return (time - (this.sunrise - 60)) / 120;
        }
        // Day
        else if (time >= this.sunrise + 60 && time < this.sunset - 60) {
            return 1;
        }
        // Dusk
        else if (time >= this.sunset - 60 && time < this.sunset + 60) {
            return 1 - ((time - (this.sunset - 60)) / 120);
        }
        // Night
        else {
            return 0;
        }
    }

    scheduleEvent(time, callback, recurring = false) {
        const event = { time, callback };
        
        if (recurring) {
            this.recurringEvents.add(event);
        } else {
            this.scheduledEvents.set(time, callback);
        }
        
        return event;
    }

    cancelEvent(event) {
        this.scheduledEvents.delete(event.time);
        this.recurringEvents.delete(event);
    }

    checkScheduledEvents() {
        // Verificar eventos únicos
        for (const [time, callback] of this.scheduledEvents.entries()) {
            if (this.currentTime >= time) {
                callback();
                this.scheduledEvents.delete(time);
            }
        }
        
        // Verificar eventos recorrentes
        for (const event of this.recurringEvents) {
            if (this.currentTime % this.dayDuration === event.time) {
                event.callback();
            }
        }
    }

    addHourChangeListener(callback) {
        this.onHourChange.add(callback);
    }

    removeHourChangeListener(callback) {
        this.onHourChange.delete(callback);
    }

    addDayChangeListener(callback) {
        this.onDayChange.add(callback);
    }

    removeDayChangeListener(callback) {
        this.onDayChange.delete(callback);
    }

    addTimeOfDayChangeListener(callback) {
        this.onTimeOfDayChange.add(callback);
    }

    removeTimeOfDayChangeListener(callback) {
        this.onTimeOfDayChange.delete(callback);
    }

    setTime(hour, minute = 0) {
        this.currentTime = (hour * 60 + minute) % this.dayDuration;
    }

    setTimeScale(scale) {
        this.timeScale = Math.max(1, Math.min(scale, 300));
    }

    pause() {
        this.previousTimeScale = this.timeScale;
        this.timeScale = 0;
    }

    resume() {
        this.timeScale = this.previousTimeScale || 60;
    }

    // Funções de utilidade para NPCs e eventos
    isWorkingHours() {
        const hour = this.getHour();
        return hour >= 8 && hour < 18;
    }

    isShopOpen() {
        const hour = this.getHour();
        return hour >= 9 && hour < 17;
    }

    isSleepingHours() {
        const hour = this.getHour();
        return hour >= 22 || hour < 6;
    }

    isWeekend() {
        return this.getDay() % 7 >= 5;
    }
}
