package com.cgi.flightapp.util;

import com.cgi.flightapp.model.Flight;

import java.util.*;

public class FlightGenerator {

    private static final String[] DESTINATIONS = {
        "London", "Paris", "Berlin", "Oslo", "Helsinki", "Rome", "Amsterdam", "Vienna"
    };

    private static final String[] TIMES = {
        "06:00", "08:15", "09:30", "11:45", "13:00", "14:20", "16:40", "18:10", "20:00", "22:30"
    };

    private static final String[] DURATIONS = {
        "2h 10m", "2h 30m", "3h", "2h 50m", "1h 45m", "2h 15m"
    };

    public static List<Flight> generateFlightScheduleForDate(String date) {
        List<Flight> flights = new ArrayList<>();
        Random random = new Random();
        String from = "Tallinn";

        for (int i = 0; i < 20; i++) {
            String to = DESTINATIONS[random.nextInt(DESTINATIONS.length)];
            String time = TIMES[random.nextInt(TIMES.length)];
            String duration = DURATIONS[random.nextInt(DURATIONS.length)];
            double price = 50 + random.nextInt(200); // €50–250

            flights.add(new Flight(from, to, date, time, duration, price));
        }

        return flights;
    }
}
