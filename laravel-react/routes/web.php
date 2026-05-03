<?php

use Illuminate\Support\Facades\Route;

Route::view('/admin/{any?}', 'app')->where('any', '.*');

Route::view('/{any?}', 'app')->where('any', '.*');
