/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IssueKey } from './pages/IssueKey';
import { ReturnKey } from './pages/ReturnKey';
import { History } from './pages/History';
import { Manage } from './pages/Manage';
import { Search } from './pages/Search';
import { Review } from './pages/Review';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="issue" element={<IssueKey />} />
          <Route path="return" element={<ReturnKey />} />
          <Route path="search" element={<Search />} />
          <Route path="review" element={<Review />} />
          <Route path="history" element={<History />} />
          <Route path="manage" element={<Manage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
