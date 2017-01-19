#!/usr/bin/env bash

sh -e /etc/init.d/xvfb start
npm install -g selenium-standalone
selenium-standalone install
selenium-standalone start > selenium.log 2>&1 &
