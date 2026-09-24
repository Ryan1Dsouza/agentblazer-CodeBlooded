import test from 'node:test';
import assert from 'node:assert/strict';
import { isCollegeGoogleUser, getCollegeDisplayName, getAuthErrorMessage } from '../src/lib/authPolicy.ts';

const collegeUser = {
  email: '24g55.ryan@sjec.ac.in',
  emailVerified: true,
  providerData: [{ providerId: 'google.com' }],
};

test('verified college Google accounts unlock chat and extract the student name', () => {
  assert.equal(isCollegeGoogleUser(collegeUser), true);
  assert.equal(isCollegeGoogleUser({ ...collegeUser, email: '24G55.RYAN@SJEC.AC.IN' }), true);
  assert.equal(getCollegeDisplayName(collegeUser.email), 'Ryan');
});

test('personal email, lookalike domains and missing addresses cannot unlock chat', () => {
  for (const email of ['ryan@gmail.com', 'ryan@sjec.ac.in.evil.com', 'ryan@sub.sjec.ac.in', 'ryan@fakesjec.ac.in', 'ryan@@sjec.ac.in', '@sjec.ac.in', null]) {
    assert.equal(isCollegeGoogleUser({ ...collegeUser, email }), false, String(email));
  }
});

test('an unverified email or non-Google session cannot unlock chat', () => {
  assert.equal(isCollegeGoogleUser({ ...collegeUser, emailVerified: false }), false);
  assert.equal(isCollegeGoogleUser({ ...collegeUser, providerData: [{ providerId: 'password' }] }), false);
  assert.equal(isCollegeGoogleUser({ ...collegeUser, providerData: [] }), false);
});

test('disabled Google provider is explained instead of a generic failure', () => {
  for (const code of ['auth/operation-not-allowed', 'auth/configuration-not-found']) {
    assert.match(getAuthErrorMessage({ code }), /Google sign-in is not enabled/);
  }
});

test('popup blocking, cancellation, network and domain errors give relevant guidance', () => {
  assert.match(getAuthErrorMessage({ code: 'auth/popup-blocked' }), /Allow pop-ups/);
  assert.match(getAuthErrorMessage({ code: 'auth/popup-closed-by-user' }), /cancelled/);
  assert.match(getAuthErrorMessage({ code: 'auth/unauthorized-domain' }), /website address/);
  assert.match(getAuthErrorMessage({ code: 'auth/network-request-failed' }), /connection/);
  assert.match(getAuthErrorMessage(null), /try again/);
});
