/**
 * Tasks:
 * 1. Features
 * 1.1 Conditionally render numeric values inside table, Red if it's below zero, Green Otherwise.
 * 1.2 By default the table should not be visible, it should only render if calculate button is clicked. (Optional)
 * 2. Fix Bugs
 * 2.1 The default Period Start Date picker input should get the AM/PM right.
 * 2.2 When any or the inputs Numeric inputs ("Spot Price", "Strike Price", etc.)
 *     are cleared it should not give any warning or error in browser console.
 */

"use client";
import React, { useState } from "react";
import { Gaussian } from "ts-gaussian";
import {
  Box,
  TextField,
  Button,
  Container,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { isNull } from "lodash";

export default function Page() {
  const defaultPeriodStart = dayjs();
  const defaultPeriodEnd = defaultPeriodStart.endOf("M");
  const [spot, setSpot] = useState<number>(8400);
  const [strike, setStrike] = useState<number>(8600);
  const [periodStart, setPeriodStart] = useState<string | null>(
    defaultPeriodStart.format("YYYY-MM-DD hh:mm:ss")
  );
  const [expiry, setExpiry] = useState<string | null>(
    defaultPeriodEnd.format("YYYY-MM-DD hh:mm:ss")
  );
  const [volatility, setVolatility] = useState<number>(18);
  const [interest, setInterest] = useState<number>(7);
  const [dividend, setDividend] = useState<number>(0.0);

  const [tableData, setTableData] = useState({
    callOptionPremium: 0.17,
    putOptionPremium: 198.52,
    callOptionDelta: 0.007,
    putOptionDelta: -0.993,
    optionGamma: 0.0002,
    callOptionTheta: -0.754,
    putOptionTheta: 0.895,
    callOptionRho: 0.002,
    putOptionRho: -0.234,
    optionVega: 0.083,
  });

  const handleCalculate = () => {
    console.log("Calculating with values:", {
      spot,
      strike,
      periodStart,
      expiry,
      volatility,
      interest,
      dividend,
    });
    if (
      !volatility ||
      !interest ||
      !dividend ||
      !expiry ||
      !strike ||
      !spot ||
      !periodStart
    ) {
      alert(`Validation Failed`);
      return;
    }

    const dateNow = new Date(periodStart);
    const dateExpiry = new Date(expiry);

    const seconds = Math.floor(
      (dateExpiry.getTime() - dateNow.getTime()) / 1000
    );
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const delta_t = Math.floor(hours / 24) / 365.0;

    const volt = volatility / 100;
    const interestRate = interest / 100;

    if (hours < 24) {
      alert(
        `Please select a later date and time. Expiry should be minimum 24 hours from entry time.`
      );
      return;
    }

    const d1 =
      (Math.log(spot / strike) +
        (interestRate + Math.pow(volt, 2) / 2) * delta_t) /
      (volt * Math.sqrt(delta_t));
    const d2 =
      (Math.log(spot / strike) +
        (interestRate - Math.pow(volt, 2) / 2) * delta_t) /
      (volt * Math.sqrt(delta_t));

    const fv_strike = strike * Math.exp(-1 * interestRate * delta_t);

    //For calculating CDF and PDF using gaussian library
    const distribution = new Gaussian(0, 1);

    //Premium Price
    const call_premium =
      spot * distribution.cdf(d1) - fv_strike * distribution.cdf(d2);
    const put_premium =
      fv_strike * distribution.cdf(-1 * d2) - spot * distribution.cdf(-1 * d1);

    //Option greeks
    const call_delta = distribution.cdf(d1);
    const put_delta = call_delta - 1;

    const call_gamma =
      distribution.pdf(d1) / (spot * volt * Math.sqrt(delta_t));
    // const put_gamma = call_gamma;

    const call_vega = (spot * distribution.pdf(d1) * Math.sqrt(delta_t)) / 100;
    // const put_vega = call_vega;

    const call_theta =
      ((-1 * spot * distribution.pdf(d1) * volt) / (2 * Math.sqrt(delta_t)) -
        interestRate * fv_strike * distribution.cdf(d2)) /
      365;
    const put_theta =
      ((-1 * spot * distribution.pdf(d1) * volt) / (2 * Math.sqrt(delta_t)) +
        interestRate * fv_strike * distribution.cdf(-1 * d2)) /
      365;

    const call_rho = (fv_strike * delta_t * distribution.cdf(d2)) / 100;
    const put_rho =
      (-1 * fv_strike * delta_t * distribution.cdf(-1 * d2)) / 100;

    setTableData({
      callOptionPremium: call_premium,
      putOptionPremium: put_premium,
      callOptionDelta: call_delta,
      putOptionDelta: put_delta,
      optionGamma: call_gamma,
      callOptionTheta: call_theta,
      putOptionTheta: put_theta,
      callOptionRho: call_rho,
      putOptionRho: put_rho,
      optionVega: call_vega,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ my: 5 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h2" mb={10} mt={4} align="center">
            Black & Scholes Pricing Formula
          </Typography>

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
              <TextField
                label="Spot Price"
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
                value={spot ?? ""}
                onChange={(e) => {
                  setSpot(parseFloat(e.target.value));
                }}
              />
              <TextField
                label="Strike Price"
                InputProps={{ inputProps: { min: 0 } }}
                type="number"
                value={strike ?? ""}
                onChange={(e) => {
                  setStrike(parseFloat(e.target.value));
                }}
              />
              <DateTimePicker
                label="Period Start (Entry Time)"
                value={dayjs(periodStart)}
                onChange={(newValue) => {
                  if (newValue?.isValid()) {
                    setPeriodStart(newValue.format("YYYY-MM-DD HH:mm:ss"));
                  } else {
                    setPeriodStart(null);
                  }
                }}
              />
              <DateTimePicker
                label="Period End (Expiry)"
                value={dayjs(expiry)}
                onChange={(newValue) => {
                  if (newValue?.isValid()) {
                    setExpiry(newValue.format("YYYY-MM-DD HH:mm:ss"));
                  } else {
                    setExpiry(null);
                  }
                }}
              />
              <TextField
                label="Volatility (%)"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                value={volatility ?? ""}
                onChange={(e) => {
                  setVolatility(parseFloat(e.target.value));
                }}
              />
              <TextField
                label="Interest (%)"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                value={interest ?? ""}
                onChange={(e) => {
                  setInterest(parseFloat(e.target.value));
                }}
              />
              <TextField
                label="Dividend Yield"
                type="number"
                InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                value={dividend ?? ""}
                onChange={(e) => {
                  setDividend(parseFloat(e.target.value));
                }}
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              onClick={handleCalculate}
              sx={{ mt: 2 }}
            >
              Calculate
            </Button>
          </form>
        </Box>
        <Box>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Call Option Premium</TableCell>
                  <TableCell>Put Option Premium</TableCell>
                  <TableCell>Call Option Delta</TableCell>
                  <TableCell>Put Option Delta</TableCell>
                  <TableCell>Option Gamma</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <>{tableData.callOptionPremium.toFixed(2)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.putOptionPremium.toFixed(2)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.callOptionDelta.toFixed(3)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.putOptionDelta.toFixed(3)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.optionGamma.toFixed(4)}</>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Call Option Theta</TableCell>
                  <TableCell>Put Option Theta</TableCell>
                  <TableCell>Call Option Rho</TableCell>
                  <TableCell>Put Option Rho</TableCell>
                  <TableCell>Option Vega</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <>{tableData.callOptionTheta.toFixed(3)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.putOptionTheta.toFixed(3)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.callOptionRho.toFixed(3)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.putOptionRho.toFixed(3)}</>
                  </TableCell>
                  <TableCell>
                    <>{tableData.optionVega.toFixed(3)}</>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </LocalizationProvider>
    </Container>
  );
}
