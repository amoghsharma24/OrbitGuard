package com.orbital.backend.config;

import jakarta.annotation.PostConstruct;
import org.orekit.data.DataContext;
import org.orekit.data.DataProvidersManager;
import org.orekit.data.DirectoryCrawler;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
public class OrekitConfig {

    @PostConstruct
    public void init() {
        try {
            System.out.println("Initialising Orekit Physics Engine...");

            File orekitData = new File(System.getProperty("user.home"), ".orekit-data");

            // Feeding the data to Orekit
            File subFolder = new File(orekitData, "orekit-data-master");
            if (subFolder.exists()) {
                orekitData = subFolder;
            }

            DataProvidersManager manager = DataContext.getDefault().getDataProvidersManager();
            manager.addProvider(new DirectoryCrawler(orekitData));

            System.out.println("Orekit Initialised Successfully using data at: " + orekitData.getAbsolutePath());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}