import { networkIsOnline } from '../providers';

test.each([
  [{isConnected:true,isInternetReachable:true},true],
  [{isConnected:true,isInternetReachable:null},true],
  [{isConnected:true,isInternetReachable:false},false],
  [{isConnected:false,isInternetReachable:true},false],
  [{isConnected:null,isInternetReachable:null},false],
] as const)('derives connectivity from connection and reachability (%o)',(state,expected)=>{
  expect(networkIsOnline(state)).toBe(expected);
});
