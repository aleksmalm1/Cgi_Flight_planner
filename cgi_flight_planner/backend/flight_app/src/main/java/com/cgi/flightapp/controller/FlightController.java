package com.cgi.flightapp.controller;

import com.cgi.flightapp.model.Flight;
import com.cgi.flightapp.util.FlightGenerator;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET})
public class FlightController {

    @GetMapping
    public List<Flight> getFlightsByDate(@RequestParam String date) {
        return FlightGenerator.generateFlightScheduleForDate(date);
    }
}
