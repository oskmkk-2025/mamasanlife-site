const fs = require('fs');
const posts = JSON.parse(fs.readFileSync('all_posts_list.json', 'utf8'));
const processedIds = new Set([
    'UhrFXXaebw9Cm7yUMOvGCU', 'UhrFXXaebw9Cm7yUMOvHuo', 'UhrFXXaebw9Cm7yUMOvII4',
    'UhrFXXaebw9Cm7yUMOvJCY', 'UhrFXXaebw9Cm7yUMOvJn6', 'UhrFXXaebw9Cm7yUMOvKKK',
    'UhrFXXaebw9Cm7yUMOvLBU', 'UhrFXXaebw9Cm7yUMOvLc4', 'UhrFXXaebw9Cm7yUMOvMCc',
    'UhrFXXaebw9Cm7yUMOvMPu', 'UhrFXXaebw9Cm7yUMOvMdC', 'UhrFXXaebw9Cm7yUMOvNH4',
    'UhrFXXaebw9Cm7yUMOvNUM', 'UhrFXXaebw9Cm7yUMOvNeK', 'UhrFXXaebw9Cm7yUMOvO4u',
    'UhrFXXaebw9Cm7yUMOvOLW', 'mebuq6EaBE5xLCmLicoDKD', 'mebuq6EaBE5xLCmLicoDip',
    'mebuq6EaBE5xLCmLicoE3v', 'mebuq6EaBE5xLCmLicoEZZ', 'mebuq6EaBE5xLCmLicoFFl',
    'mebuq6EaBE5xLCmLicoFar', 'mebuq6EaBE5xLCmLicoFsR', 'mebuq6EaBE5xLCmLicoG6V',
    'mebuq6EaBE5xLCmLicoGc9', 'mebuq6EaBE5xLCmLicoGtj', 'mebuq6EaBE5xLCmLicoH4H',
    'mebuq6EaBE5xLCmLicoCe1', 'drafts.Nn6Sc6MF3u71woMpYvaSQk',
    'Nn6Sc6MF3u71woMpYvaGWM', 'Nn6Sc6MF3u71woMpYvaGwj', 'Nn6Sc6MF3u71woMpYvaHCY',
    'Nn6Sc6MF3u71woMpYvaHSN', 'Nn6Sc6MF3u71woMpYvaI8Z', 'Nn6Sc6MF3u71woMpYvaIzJ',
    'Nn6Sc6MF3u71woMpYvaKLh', 'Nn6Sc6MF3u71woMpYvaLCR', 'Nn6Sc6MF3u71woMpYvaLi5',
    'Nn6Sc6MF3u71woMpYvaLxu', 'Nn6Sc6MF3u71woMpYvaMOH', 'Nn6Sc6MF3u71woMpYvaMzC',
    'Nn6Sc6MF3u71woMpYvaNF1', 'Nn6Sc6MF3u71woMpYvaNa7', 'Nn6Sc6MF3u71woMpYvaOB2',
    'Nn6Sc6MF3u71woMpYvaOQr', 'Nn6Sc6MF3u71woMpYvaOrE', 'Nn6Sc6MF3u71woMpYvaP73',
    'Nn6Sc6MF3u71woMpYvaPMs', 'Nn6Sc6MF3u71woMpYvaPnF'
]);
const remaining = posts.filter(p => !processedIds.has(p._id) && !p._id.startsWith('drafts.'));
console.log(JSON.stringify(remaining, null, 2));
