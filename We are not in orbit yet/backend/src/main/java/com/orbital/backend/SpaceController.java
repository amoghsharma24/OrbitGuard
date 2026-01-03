package com.orbital.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.orekit.time.AbsoluteDate;
import org.orekit.time.TimeScalesFactory;

@RestController
public class SpaceController {

    @GetMapping("/api/health")
    public String healthCheck() {
        return "Systems Online: OrbitalGuard is active.";
    }
}