package com.cgi.flightapp.model;

public class Flight {
    private String from;
    private String to;
    private String date;
    private String time;
    private String duration;
    private double price;

    public Flight(String from, String to, String date, String time, String duration, double price) {
        this.from = from;
        this.to = to;
        this.date = date;
        this.time = time;
        this.duration = duration;
        this.price = price;
    }

    public String getFrom() { return from; }
    public String getTo() { return to; }
    public String getDate() { return date; }
    public String getTime() { return time; }
    public String getDuration() { return duration; }
    public double getPrice() { return price; }

    public void setFrom(String from) { this.from = from; }
    public void setTo(String to) { this.to = to; }
    public void setDate(String date) { this.date = date; }
    public void setTime(String time) { this.time = time; }
    public void setDuration(String duration) { this.duration = duration; }
    public void setPrice(double price) { this.price = price; }
}
